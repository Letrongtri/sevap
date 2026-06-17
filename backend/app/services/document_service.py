import math
import uuid
import hashlib
from typing import List
from fastapi import UploadFile, BackgroundTasks
from pathlib import Path
from datetime import datetime
import shutil
import uuid
import tempfile
import os

from app.models import Document, DocumentChunk, VectorEmbedding, Department
from app.repositories import DocumentRepository, RoleRepository, UserRepository
from app.services.chunking_service import ChunkService
from app.services.exceptions import DocumentAlreadyExistsError, NotFoundError, MissingRequiredFieldsError
from app.core.enum import AccessLevel, DocumentStatus
from app.core.logging import logger
from app.schemas import (
    DocumentQuery, 
    DocumentResponse, 
    DocumentPaginatedResponse, 
    PaginationQuery, 
    PaginationResponse, 
    RoleSimple, 
    UserSimple
)

class DocumentService:
    def __init__(self, repo: DocumentRepository, role_repo: RoleRepository, user_repo: UserRepository):
        self.repo = repo
        self.role_repo = role_repo
        self.user_repo = user_repo

    async def upload(self, file: UploadFile, uploader_id: int, access_level: str,
                     background_tasks: BackgroundTasks, department_ids: List[int] = None, 
                     title: str = None, category: str = None, 
                     effective_date: datetime = None, role_access: List[int] = None,
                     target_user_ids: List[int] = None
    ) -> Document:
        if access_level == AccessLevel.PRIVATE:
            if not department_ids and not role_access and not target_user_ids:
                raise MissingRequiredFieldsError()
            
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        UPLOAD_DIR = BASE_DIR / "data" / "uploads"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        uploaded_file_name = f"{uuid.uuid4()}_{file.filename}"
        uploaded_file_path = UPLOAD_DIR / uploaded_file_name
        temp_file_path = os.path.join(tempfile.gettempdir(), uploaded_file_name)

        file_hash = hashlib.sha256() # Khởi tạo bộ băm SHA-256
        
        try:
            with open(temp_file_path, "wb") as buffer:
                # Vừa copy file vừa tính hash để tiết kiệm RAM (đọc theo block)
                while chunk := file.file.read(8192):
                    buffer.write(chunk)
                    file_hash.update(chunk)
        except Exception:
            raise Exception("Failed to save file to disk")
        finally:
            file.file.close()

        hash_value = file_hash.hexdigest()
        existing = await self.repo.get_document_by_hash(hash_value)
        
        # If document already exists, raise already exists error
        # If document exists but is deleted, restore it
        if existing and existing.is_deleted is False:
            raise NotFoundError()
        elif existing and existing.is_deleted is True:
            await self.repo.restore_document(existing.id)
            return await self.repo.get_document_by_id(existing.id, get_roles=True, get_users=True, get_departments=True)
        
        # check roles
        roles = []
        if role_access is not None:
            for role_id in role_access:
                existing_role = await self.role_repo.get_role_by_id(role_id)
                if existing_role is None:
                    raise NotFoundError()
                
                roles.append(existing_role)

        target_users = []
        if target_user_ids is not None:
            for user_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(user_id)
                if existing_user is None:
                    raise NotFoundError()
                
                target_users.append(existing_user)

        departments = []
        if department_ids is not None:
            for dept_id in department_ids:
                existing_dept = await self.repo.db.get(Department, dept_id)
                if existing_dept is None:
                    raise NotFoundError()
                departments.append(existing_dept)
        
        shutil.move(temp_file_path, uploaded_file_path)
            
        uploader_id = uploader_id
        title = file.filename if title is None else title
        document = Document(
            uploader_id=uploader_id, 
            title=title, 
            access_level=access_level, 
            file_name=uploaded_file_name, 
            file_type=file.content_type, 
            file_path=str(uploaded_file_path), 
            file_size=file.size, 
            status=DocumentStatus.PROCESSING, 
            is_deleted=False,
            category=category,
            effective_date=effective_date,
            file_hash=file_hash.hexdigest(),
        )

        if role_access is not None:
            document.roles = roles

        if target_user_ids is not None:
            document.target_users = target_users

        if department_ids is not None:
            document.departments = departments

        saved_document = await self.repo.create_document(document)

        background_tasks.add_task(
            self._process_document_chunking, 
            document_id=saved_document.id, 
            file_path=str(uploaded_file_path),
            access_level=access_level,
            department_ids=department_ids,
            category=category,
            effective_date=effective_date,
            role_access=role_access,
            target_user_ids=target_user_ids
        )

        return saved_document
        
    async def _process_document_chunking(
            self, document_id: int, file_path: str, access_level: str, 
            department_ids: List[int] = None, category: str = None, effective_date: datetime = None,
            role_access: List[int] = None, target_user_ids: List[int] = None):
        try:
            chunking_service = ChunkService()
            chunks = await chunking_service.hybrid_chunking(doc_path=str(file_path))
            document_chunks = []

            for i, chunk in enumerate(chunks):
                context_content = await chunking_service.get_chunk_context(chunk)
                chunk_meta = getattr(chunk, 'meta_data', {}) or {}
                chunk_meta.update({
                    "chunking_strategy": "hybrid",
                    "category": category,
                    "effective_date": effective_date.strftime("%Y-%m-%d") if effective_date else None,
                    "access_level": access_level,
                    "department_ids": department_ids,
                    "user_accesses": target_user_ids,
                    "role_access": role_access
                })

                document_chunk = DocumentChunk(
                    chunk_index=i,
                    content=chunk.text,
                    context_content=context_content,
                    embedding_model=chunking_service.embedding_model_name,
                    embedding_status=DocumentStatus.DONE,
                    meta_data=chunk_meta
                )

                embedding = await chunking_service.embedding_chunking(
                    chunk=chunk
                )

                vector_embedding = VectorEmbedding(
                    embedding=embedding,
                    model_name=chunking_service.embedding_model_name,
                    dimensions=chunking_service.embedding_model_dimension
                )
                document_chunk.vector_embedding = vector_embedding
                document_chunks.append(document_chunk)
            
            await self.repo.save_chunks(document_id, document_chunks)
            await self.repo.update_document_status(document_id, DocumentStatus.DONE)

        except Exception as e:
            logger.error("document_chunking_failed", document_id=document_id, exc_info=True)
            await self.repo.update_document_status(document_id, DocumentStatus.FAILED)

    async def get_all_documents(
        self, query: DocumentQuery, 
        pagination: PaginationQuery
    ) -> DocumentPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit
        documents, total_records = await self.repo.get_all_documents(
            query=query.query,
            department_id=query.department_id,
            role_id=query.role_id,
            user_id=query.user_id,
            access_level=query.access_level,
            effective_date=query.effective_date,
            skip=skip,
            limit=pagination.limit
        )

        total_pages = math.ceil(total_records / pagination.limit) if total_records > 0 else 0

        document_responses = [
            DocumentResponse.model_validate(document) for document in documents
        ]

        # 5. Đóng gói kết quả trả về
        return DocumentPaginatedResponse(
            documents=document_responses,
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )
    
    async def get_document_by_id(self, document_id: int):
        document = await self.repo.get_document_by_id(document_id, get_chunks=True, get_roles=True, get_users=True, get_departments=True)

        if document is None or document.is_deleted is True:
            raise NotFoundError()
        
        return document

    async def update_document(self, document_id: int, access_level: str = None, 
                              department_ids: List[int] = None, title: str = None, 
                              category: str = None, effective_date: datetime = None,
                              role_access: List[int] = None, target_user_ids: List[int] = None) -> Document:
        existing = await self.repo.get_document_by_id(document_id, get_roles=True, get_users=True, get_departments=True)
        
        if existing is None or existing.is_deleted is True:
            raise NotFoundError()

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
                if existing_role is None:
                    raise NotFoundError()
                
                roles.append(existing_role)
            existing.roles = roles
        
        if target_user_ids is not None:
            users = []
            for user_id in target_user_ids:
                existing_user = await self.user_repo.get_user_by_id(user_id)
                if existing_user is None:
                    raise NotFoundError()
                
                users.append(existing_user)
            existing.target_users = users

        if department_ids is not None:
            departments = []
            for dept_id in department_ids:
                existing_dept = await self.repo.db.get(Department, dept_id)
                if existing_dept is None:
                    raise NotFoundError()
                departments.append(existing_dept)
            existing.departments = departments

        await self.repo.save_document(existing)

        return await self.repo.get_document_by_id(document_id, get_roles=True, get_users=True, get_departments=True)

    async def delete_document(self, document_id: int):
        existing = await self.repo.get_document_by_id(document_id, get_roles=True, get_users=True, get_departments=True)

        if existing is None or existing.is_deleted is True:
            raise NotFoundError()
        
        existing.is_deleted = True
        
        await self.repo.save_document(existing)
        return await self.repo.get_document_by_id(document_id, get_roles=True, get_users=True, get_departments=True)
    