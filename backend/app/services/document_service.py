import math
import uuid
import hashlib
import os
import shutil
import tempfile
from typing import List
from fastapi import UploadFile, BackgroundTasks
from pathlib import Path
from datetime import datetime

from app.models import Document, Department, JobTitle, Role, DocumentAccessPolicy, AccessPolicyCondition
from app.repositories import DocumentRepository, RoleRepository, UserRepository
from app.services.exceptions import (
    NotFoundError, MissingRequiredFieldsError, OnProcessingError, AccessDeniedError
)
from app.core.enum import AccessLevel, DocumentStatus, DocumentAccessPolicyConditionType
from app.core.config import settings
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.schemas import UserSecurityContext
from app.tasks import process_document_chunking_task, sync_chunk_metadata_task
from app.schemas import (
    DocumentQuery, 
    DocumentResponse, 
    DocumentPaginatedResponse, 
    PaginationQuery, 
    PaginationResponse,
    DocumentAccessPolicyCreate
)

class DocumentService:
    def __init__(
        self,
        repo: DocumentRepository,
        role_repo: RoleRepository,
        user_repo: UserRepository,
        par_repo: PARRepository
    ):
        self.repo = repo
        self.role_repo = role_repo
        self.user_repo = user_repo
        self.par_repo = par_repo

    async def _check_document_access(
        self, tenant_id: str, user_id: str, document_id: str, 
        is_admin: bool = False, session_id: str = None, ip_address: str = None
    ) -> None:
        """Kiểm tra user có quyền truy cập document_id thông qua PAR gate.
        Raise AccessDeniedError nếu document_id không nằm trong allowed set.
        """
        security_ctx = UserSecurityContext(
            user_id, tenant_id, is_admin, session_id, ip_address
        )
        ctx = await self.par_repo.build_par_context(security_ctx)
        allowed_ids = await self.par_repo.get_allowed_document_ids(ctx)
        if document_id not in allowed_ids:
            raise AccessDeniedError()

    async def _validate_policies(
        self,
        tenant_id: str,
        policies: List[DocumentAccessPolicyCreate]
    ) -> None:
        for p in policies:
            for cond in p.conditions:
                c_type = cond.condition_type.value if hasattr(cond.condition_type, "value") else str(cond.condition_type)
                v_id = cond.condition_value_id
                if c_type == DocumentAccessPolicyConditionType.ROLES.value:
                    r = await self.role_repo.get_role_by_id(v_id)
                    if not r or r.tenant_id != tenant_id:
                        raise NotFoundError()
                elif c_type == DocumentAccessPolicyConditionType.DEPARTMENTS.value:
                    d = await self.repo.db.get(Department, v_id)
                    if not d or d.tenant_id != tenant_id:
                        raise NotFoundError()
                elif c_type == DocumentAccessPolicyConditionType.JOB_TITLES.value:
                    jt = await self.repo.db.get(JobTitle, v_id)
                    if not jt or jt.tenant_id != tenant_id:
                        raise NotFoundError()

    def _apply_document_policies(
        self,
        document: Document,
        tenant_id: str,
        creator_id: str,
        access_level: str,
        policies: List[DocumentAccessPolicyCreate] = None
    ):
        document.access_level = access_level
        document.document_access_policies.clear()

        # BUG 2 fix: guard policies=None — nếu không có policies thì chỉ clear,
        # không cố loop qua None gây TypeError
        if access_level == AccessLevel.PRIVATE and policies:
            for policy_in in policies:
                if not policy_in.conditions:
                    continue
                policy = DocumentAccessPolicy(
                    tenant_id=tenant_id,
                    created_by=creator_id
                )
                for cond_in in policy_in.conditions:
                    cond_type = cond_in.condition_type.value if hasattr(cond_in.condition_type, "value") else str(cond_in.condition_type)
                    policy.conditions.append(
                        AccessPolicyCondition(
                            condition_type=cond_type,
                            condition_value_id=cond_in.condition_value_id
                        )
                    )
                document.document_access_policies.append(policy)

    async def _to_document_response(self, document: Document) -> DocumentResponse:
        roles = []
        departments = []
        job_titles = []  # BUG 3 fix: thêm job_titles
        seen_role_ids = set()
        seen_dept_ids = set()
        seen_jt_ids = set()  # BUG 3 fix

        if getattr(document, "document_access_policies", None):
            for policy in document.document_access_policies:
                if getattr(policy, "conditions", None):
                    for cond in policy.conditions:
                        if cond.condition_type == DocumentAccessPolicyConditionType.ROLES.value:
                            if cond.condition_value_id not in seen_role_ids:
                                seen_role_ids.add(cond.condition_value_id)
                                r = await self.role_repo.get_role_by_id(cond.condition_value_id)
                                if r:
                                    roles.append(r)
                        elif cond.condition_type == DocumentAccessPolicyConditionType.DEPARTMENTS.value:
                            if cond.condition_value_id not in seen_dept_ids:
                                seen_dept_ids.add(cond.condition_value_id)
                                d = await self.repo.db.get(Department, cond.condition_value_id)
                                if d:
                                    departments.append(d)
                        elif cond.condition_type == DocumentAccessPolicyConditionType.JOB_TITLES.value:
                            # BUG 3 fix: load job_title và thêm vào list
                            if cond.condition_value_id not in seen_jt_ids:
                                seen_jt_ids.add(cond.condition_value_id)
                                jt = await self.repo.db.get(JobTitle, cond.condition_value_id)
                                if jt:
                                    job_titles.append(jt)

        response = DocumentResponse.model_validate(document)
        response.roles = roles
        response.departments = departments
        response.job_titles = job_titles  # BUG 3 fix
        return response

    async def upload(
        self, 
        tenant_id: str, file: UploadFile, uploader_id: str, access_level: str,
        background_tasks: BackgroundTasks, title: str = None, 
        category: str = None, effective_date: datetime = None, 
        policies: List[DocumentAccessPolicyCreate] = None,
        target_user_ids: List[str] = None
    ) -> DocumentResponse:
        if access_level == AccessLevel.PRIVATE:
            has_policies = any(p.conditions for p in policies) if policies else False
            if not has_policies and not target_user_ids:
                raise MissingRequiredFieldsError()
            
        UPLOAD_DIR = settings.UPLOAD_DIR
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        uploaded_file_name = f"{uuid.uuid4()}_{file.filename}"
        temp_file_path = os.path.join(tempfile.gettempdir(), uploaded_file_name)

        file_hash = hashlib.sha256()
        actual_file_size = 0  # Tính file_size từ bytes thực tế

        # Khởi tạo sớm để tránh NameError nếu có exception trước khi gán
        saved_document = None
        uploaded_file_path = None
        
        try:
            with open(temp_file_path, "wb") as buffer:
                # Vừa copy file vừa tính hash để tiết kiệm RAM (đọc theo block)
                while chunk := file.file.read(8192):
                    buffer.write(chunk)
                    file_hash.update(chunk)
                    actual_file_size += len(chunk)
        except Exception:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise Exception("Failed to save file to disk")
        finally:
            file.file.close()

        hash_value = file_hash.hexdigest()
        existing = await self.repo.get_document_by_hash(tenant_id, hash_value)
        
        if existing:
            # Trường hợp A: File đang trong hàng đợi hoặc đang xử lý → Báo lỗi chặn trùng lặp ngay
            if existing.status in [DocumentStatus.PROCESSING, DocumentStatus.PENDING]:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise OnProcessingError()
            
            # Trường hợp B: File đã xử lý thành công trước đó
            if existing.status == DocumentStatus.DONE:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

                target_users = [
                    await self.user_repo.get_user_by_id(
                        u_id,
                        get_user_department=True,
                        get_user_job_title=True
                    )
                    for u_id in (target_user_ids or [])
                ]

                existing.category = category if category else existing.category
                existing.effective_date = effective_date if effective_date else existing.effective_date
                existing.is_deleted = False

                existing.target_users = target_users
                await self._validate_policies(tenant_id, policies=policies)
                self._apply_document_policies(existing, tenant_id, uploader_id, access_level, policies=policies)

                await self.repo.save_document(existing)

                # Reload lại với eager loading đầy đủ để tránh MissingGreenlet
                updated_document = await self.repo.get_document_by_id(existing.id, get_users=True)

                background_tasks.add_task(
                    sync_chunk_metadata_task,
                    tenant_id=tenant_id,
                    document_id=updated_document.id,
                    access_level=access_level,
                    category=category,
                    effective_date=effective_date,
                    target_user_ids=target_user_ids
                )

                return await self._to_document_response(updated_document)
                
            # Trường hợp C: File cũ bị lỗi (FAILED) → Tái sử dụng metadata, ghi đè file mới để pipeline thử lại
            elif existing.status == DocumentStatus.FAILED:
                uploaded_file_path = Path(existing.file_path)
                try:
                    shutil.move(temp_file_path, uploaded_file_path)
                except Exception:
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                    raise Exception("Failed to move file to upload directory")
                
                await self.repo.update_document_status(existing.id, DocumentStatus.PROCESSING)

                reloaded = await self.repo.get_document_by_id(existing.id, get_users=True)

                background_tasks.add_task(
                    process_document_chunking_task,
                    tenant_id=tenant_id,
                    document_id=reloaded.id,
                    file_path=str(uploaded_file_path),
                    access_level=access_level,
                    category=category,
                    effective_date=effective_date,
                    target_user_ids=target_user_ids
                )

                return await self._to_document_response(reloaded)
            else:
                # Status không hợp lệ hoặc không xác định — dọn file tạm và báo lỗi
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise Exception(f"Document has unexpected status: {existing.status}")

        else:
            # Trường hợp D: Tài liệu mới hoàn toàn chưa từng xuất hiện trong Tenant này
            uploaded_file_path = UPLOAD_DIR / uploaded_file_name
            try:
                shutil.move(temp_file_path, uploaded_file_path)
            except Exception:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise Exception("Failed to move file to upload directory")
            saved_document = None

        # Validate policies, roles, users, departments (sau khi đã di chuyển file)
        try:
            await self._validate_policies(tenant_id, policies=policies)
        except NotFoundError:
            if saved_document is None and uploaded_file_path.exists():
                os.remove(uploaded_file_path)
            raise NotFoundError()

        target_users = []
        if target_user_ids is not None:
            for user_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(
                    user_id,
                    get_user_department=True,
                    get_user_job_title=True
                )
                if existing_user is None:
                    if saved_document is None and uploaded_file_path.exists():
                        os.remove(uploaded_file_path)
                    raise NotFoundError()
                target_users.append(existing_user)

        # chỉ tạo Document mới khi chưa có (saved_document is None)
        if saved_document is None:
            doc_title = title if title else file.filename
            document = Document(
                tenant_id=tenant_id,
                uploader_id=uploader_id, 
                title=doc_title, 
                access_level=access_level, 
                file_name=uploaded_file_name, 
                file_type=file.content_type, 
                file_path=str(uploaded_file_path), 
                file_size=actual_file_size,
                status=DocumentStatus.PROCESSING, 
                is_deleted=False,
                category=category,
                effective_date=effective_date,
                file_hash=hash_value,
            )

            if target_user_ids is not None:
                document.target_users = target_users

            self._apply_document_policies(document, tenant_id, uploader_id, access_level, policies=policies)

            saved_document = await self.repo.create_document(document)

        # Chỉ còn case D (new document) tới đây — case C đã return sớm
        if saved_document is None:
            raise Exception("saved_document is None before scheduling background task — this is a bug")

        background_tasks.add_task(
            process_document_chunking_task,
            tenant_id=tenant_id,
            document_id=saved_document.id, 
            file_path=str(uploaded_file_path),
            access_level=access_level,
            category=category,
            effective_date=effective_date,
            target_user_ids=target_user_ids
        )

        return await self._to_document_response(saved_document)

    async def get_all_documents(
        self, tenant_id: str, user_id: str, query: DocumentQuery, 
        pagination: PaginationQuery
    ) -> DocumentPaginatedResponse:
        # Bước 1: Lấy danh sách document mà user được phép truy cập qua PAR gate
        security_ctx = UserSecurityContext(user_id=user_id, tenant_id=tenant_id)
        ctx = await self.par_repo.build_par_context(security_ctx)
        allowed_ids = await self.par_repo.get_allowed_document_ids(ctx)

        skip = (pagination.page - 1) * pagination.limit
        documents, total_records = await self.repo.get_all_documents(
            tenant_id=tenant_id,
            query=query.query,
            department_id=query.department_id,
            role_id=query.role_id,
            user_id=query.user_id,
            job_title_id=query.job_title_id,
            access_level=query.access_level,
            effective_date=query.effective_date,
            skip=skip,
            limit=pagination.limit,
            allowed_ids=allowed_ids
        )

        total_pages = (
            math.ceil(total_records / pagination.limit) 
            if total_records > 0 else 0
        )

        document_responses = [
            await self._to_document_response(document)
            for document in documents
        ]

        return DocumentPaginatedResponse(
            documents=document_responses,
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )
    
    async def get_document_by_id(
        self, tenant_id: str, user_id: str, document_id: str
    ) -> DocumentResponse:
        document = await self.repo.get_document_by_id(document_id, get_chunks=True, get_users=True)

        if document is None or document.tenant_id != tenant_id:
            raise NotFoundError()

        # PAR gate: kiểm tra user có quyền truy cập document này không
        await self._check_document_access(tenant_id, user_id, document_id)
        
        return await self._to_document_response(document)

    async def update_document(
        self, tenant_id: str, user_id: str, document_id: str, 
        access_level: str = None, title: str = None, category: str = None, 
        effective_date: datetime = None,
        policies: list[DocumentAccessPolicyCreate] = None,
        target_user_ids: list[str] = None
    ) -> DocumentResponse:
        existing = await self.repo.get_document_by_id(document_id, get_users=True)
        
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()

        # PAR gate: kiểm tra user có quyền truy cập document này không
        await self._check_document_access(tenant_id, user_id, document_id)

        if access_level is not None:
            existing.access_level = access_level
        if title is not None:
            existing.title = title
        if category is not None:
            existing.category = category
        if effective_date is not None:
            existing.effective_date = effective_date

        await self._validate_policies(tenant_id, policies=policies)
        
        if target_user_ids is not None:
            users = []
            for target_u_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(
                    target_u_id,
                    get_user_department=True,
                    get_user_job_title=True
                )
                if existing_user is None or existing_user.tenant_id != tenant_id:
                    raise NotFoundError()
                users.append(existing_user)
            existing.target_users = users

        if policies is not None or access_level is not None:
            target_access_level = access_level if access_level is not None else existing.access_level
            self._apply_document_policies(existing, tenant_id, user_id, target_access_level, policies=policies)

        await self.repo.save_document(existing)

        updated = await self.repo.get_document_by_id(document_id, get_users=True)

        return await self._to_document_response(updated)

    async def delete_document(
        self, tenant_id: str, user_id: str, document_id: str
    ) -> DocumentResponse:
        existing = await self.repo.get_document_by_id(document_id, get_users=True)

        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()

        # PAR gate: kiểm tra user có quyền truy cập document này không
        await self._check_document_access(tenant_id, user_id, document_id)
        
        existing.is_deleted = True
        
        await self.repo.save_document(existing)

        return await self._to_document_response(existing)


