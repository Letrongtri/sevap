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

from app.models import Document, Department
from app.repositories import DocumentRepository, RoleRepository, UserRepository
from app.services.exceptions import (
    NotFoundError, MissingRequiredFieldsError, OnProcessingError, AccessDeniedError
)
from app.core.enum import AccessLevel, DocumentStatus
from app.core.config import settings
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.schemas import UserSecurityContext
from app.tasks import process_document_chunking_task, sync_chunk_metadata_task
from app.schemas import (
    DocumentQuery, 
    DocumentResponse, 
    DocumentPaginatedResponse, 
    PaginationQuery, 
    PaginationResponse
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

    async def upload(
        self, 
        tenant_id: str, file: UploadFile, uploader_id: str, access_level: str,
        background_tasks: BackgroundTasks, title: str = None, 
        category: str = None, effective_date: datetime = None, 
        department_ids: List[str] = None, role_access: List[str] = None,
        target_user_ids: List[str] = None
    ) -> DocumentResponse:
        if access_level == AccessLevel.PRIVATE:
            if not department_ids and not role_access and not target_user_ids:
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

                roles = [await self.role_repo.get_role_by_id(r_id) for r_id in (role_access or [])]
                target_users = [await self.user_repo.get_user_by_id(u_id) for u_id in (target_user_ids or [])]
                departments = [await self.repo.db.get(Department, d_id) for d_id in (department_ids or [])]

                existing.access_level = access_level
                existing.category = category if category else existing.category
                existing.effective_date = effective_date if effective_date else existing.effective_date
                existing.is_deleted = False

                existing.roles = roles
                existing.target_users = target_users
                existing.departments = departments

                updated_document = await self.repo.save_document(existing)

                background_tasks.add_task(
                    sync_chunk_metadata_task,
                    tenant_id=tenant_id,
                    document_id=updated_document.id,
                    access_level=access_level,
                    category=category,
                    effective_date=effective_date,
                    department_ids=department_ids,
                    role_access=role_access,
                    target_user_ids=target_user_ids
                )

                return DocumentResponse.model_validate(updated_document)
                
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
                saved_document = existing
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

        # Validate roles, users, departments (sau khi đã di chuyển file)
        roles = []
        if role_access is not None:
            for role_id in role_access:
                existing_role = await self.role_repo.get_role_by_id(role_id)
                if existing_role is None:
                    # Xóa file đã move nếu validation thất bại ở trường hợp D
                    if saved_document is None and uploaded_file_path.exists():
                        os.remove(uploaded_file_path)
                    raise NotFoundError()
                roles.append(existing_role)

        target_users = []
        if target_user_ids is not None:
            for user_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(user_id)
                if existing_user is None:
                    if saved_document is None and uploaded_file_path.exists():
                        os.remove(uploaded_file_path)
                    raise NotFoundError()
                target_users.append(existing_user)

        departments = []
        if department_ids is not None:
            for dept_id in department_ids:
                existing_dept = await self.repo.db.get(Department, dept_id)
                if existing_dept is None:
                    if saved_document is None and uploaded_file_path.exists():
                        os.remove(uploaded_file_path)
                    raise NotFoundError()
                departments.append(existing_dept)
            
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

            if role_access is not None:
                document.roles = roles

            if target_user_ids is not None:
                document.target_users = target_users

            if department_ids is not None:
                document.departments = departments

            saved_document = await self.repo.create_document(document)

        if not existing or existing.status == DocumentStatus.FAILED:
            if saved_document is None:
                raise Exception("saved_document is None before scheduling background task — this is a bug")
            background_tasks.add_task(
                process_document_chunking_task,
                tenant_id=tenant_id,
                document_id=saved_document.id, 
                file_path=str(uploaded_file_path),
                access_level=access_level,
                department_ids=department_ids,
                category=category,
                effective_date=effective_date,
                role_access=role_access,
                target_user_ids=target_user_ids
            )

        return DocumentResponse.model_validate(saved_document)

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
            DocumentResponse.model_validate(document)
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
        document = await self.repo.get_document_by_id(
            document_id,
            get_chunks=True, 
            get_roles=True, 
            get_users=True, 
            get_departments=True
        )

        if document is None or document.tenant_id != tenant_id:
            raise NotFoundError()

        # PAR gate: kiểm tra user có quyền truy cập document này không
        await self._check_document_access(tenant_id, user_id, document_id)
        
        return DocumentResponse.model_validate(document)

    async def update_document(
        self, tenant_id: str, user_id: str, document_id: str, 
        access_level: str = None, department_ids: List[str] = None, 
        title: str = None, category: str = None, 
        effective_date: datetime = None,
        role_access: List[str] = None, target_user_ids: List[str] = None
    ) -> DocumentResponse:
        existing = await self.repo.get_document_by_id(
            document_id,
            get_roles=True,
            get_users=True,
            get_departments=True
        )
        
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

        if role_access is not None:
            roles = []
            for role_id in role_access:
                existing_role = await self.role_repo.get_role_by_id(role_id)
                if existing_role is None or existing_role.tenant_id != tenant_id:
                    raise NotFoundError()
                
                roles.append(existing_role)
            existing.roles = roles
        
        if target_user_ids is not None:
            users = []
            for user_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(user_id)
                if existing_user is None or existing_user.tenant_id != tenant_id:
                    raise NotFoundError()
                
                users.append(existing_user)
            existing.target_users = users

        if department_ids is not None:
            departments = []
            for dept_id in department_ids:
                existing_dept = await self.repo.db.get(Department, dept_id)
                if existing_dept is None or existing_dept.tenant_id != tenant_id:
                    raise NotFoundError()
                departments.append(existing_dept)
            existing.departments = departments

        await self.repo.save_document(existing)

        updated = await self.repo.get_document_by_id(
            document_id,
            get_roles=True,
            get_users=True,
            get_departments=True
        )

        return DocumentResponse.model_validate(updated)

    async def delete_document(
        self, tenant_id: str, user_id: str, document_id: str
    ) -> DocumentResponse:
        existing = await self.repo.get_document_by_id(
            document_id, 
            get_roles=True, 
            get_users=True, 
            get_departments=True
        )

        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()

        # PAR gate: kiểm tra user có quyền truy cập document này không
        await self._check_document_access(tenant_id, user_id, document_id)
        
        existing.is_deleted = True
        
        await self.repo.save_document(existing)

        return DocumentResponse.model_validate(existing)


