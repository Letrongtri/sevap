import uuid
import hashlib
from typing import List
from fastapi import UploadFile, BackgroundTasks
from pathlib import Path
from datetime import datetime
import shutil
import uuid

from app.models.document import Document
from app.models.document_chunks import DocumentChunk
from app.models.vector_embedding import VectorEmbedding
from app.repositories.document_repository import DocumentRepository
from app.repositories.role_repository import RoleRepository
from app.services.chunking_service import ChunkService
from app.services.exceptions import DocumentAlreadyExistsError, NotFoundError
from app.core.enum import DocumentStatus
from app.core.logging import logger

class DocumentService:
    def __init__(self, repo: DocumentRepository, role_repo: RoleRepository):
        self.repo = repo
        self.role_repo = role_repo

    async def upload(self, file: UploadFile, access_level: str,
                     background_tasks: BackgroundTasks, department_scope: str, 
                     title: str = None, category: str = None, 
                     effective_date: datetime = None, role_access: List[int] = None
    ) -> Document:
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        UPLOAD_DIR = BASE_DIR / "data" / "uploads"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        uploaded_file_name = f"{uuid.uuid4()}_{file.filename}"
        uploaded_file_path = UPLOAD_DIR / uploaded_file_name
        temp_file_path = f"/tmp/{uploaded_file_name}"

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
            await self.repo.restore_document(existing)
            return existing
        
        # check roles
        roles = []
        if role_access is not None:
            for role_id in role_access:
                existing_role = await self.role_repo.get_role_by_id(role_id)
                if existing_role is None:
                    raise NotFoundError()
                
                roles.append(existing_role)
        
        shutil.move(temp_file_path, uploaded_file_path)
            
        uploader_id = 1 # TODO: get from token
        title = file.filename if title is None else title
        document = Document(
            uploader_id=uploader_id, 
            title=title, 
            access_level=access_level, 
            department_scope=department_scope, 
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

        saved_document = await self.repo.create_document(document)

        background_tasks.add_task(
            self._process_document_chunking, 
            document_id=saved_document.id, 
            file_path=str(uploaded_file_path),
            access_level=access_level,
            department_scope=department_scope,
            category=category,
            effective_date=effective_date
        )

        return saved_document
        
    async def _process_document_chunking(
            self, document_id: int, file_path: str, access_level: str, 
            department_scope: str, category: str = None, effective_date: datetime = None):
        try:
            chunking_service = ChunkService()
            chunks = await chunking_service.hybrid_chunking(doc_path=str(file_path))
            document_chunks = []

            for i, chunk in enumerate(chunks):
                context_content = await chunking_service.get_chunk_context(chunk)
                chunk_meta = getattr(chunk, 'meta_data', {}) or {}
                chunk_meta.update({
                    "chunking_strategy": "hybrid",
                    "access_level": access_level,
                    "department": department_scope,
                    "category": category,
                    "effective_date": effective_date.strftime("%Y-%m-%d")
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

    async def get_documents(self):
        return await self.repo.get_documents()
    
    async def get_document_by_id(self, document_id: int):
        document = await self.repo.get_document_by_id(document_id, get_chunks=True)

        if document is None or document.is_deleted is True:
            raise NotFoundError()
        
        return document

    async def update_document(self, document_id: int, access_level: str = None, 
                              department_scope: str = None, title: str = None, 
                              category: str = None, effective_date: datetime = None,
                              role_access: List[int] = None) -> Document:
        existing = await self.repo.get_document_by_id(document_id)
        
        if existing is None or existing.is_deleted is True:
            raise DocumentAlreadyExistsError()

        if access_level is not None:
            existing.access_level = access_level
        if department_scope is not None:
            existing.department_scope = department_scope
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

        await self.repo.save_document(existing)

        return existing

    async def delete_document(self, document_id: int):
        existing = await self.repo.get_document_by_id(document_id)

        if existing is None or existing.is_deleted is True:
            raise NotFoundError()
        
        existing.is_deleted = True
        
        await self.repo.save_document(document_id)
        return existing
    