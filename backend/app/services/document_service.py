import uuid
from typing import List
from fastapi import UploadFile, BackgroundTasks
from pathlib import Path
import shutil
import uuid

from app.models.document import Document
from app.models.document_chunks import DocumentChunk
from app.models.vector_embedding import VectorEmbedding
from app.repositories.document_repository import DocumentRepository
from app.services.chunking_service import ChunkService
from app.core.enum import DocumentStatus
from app.core.logging import logger

class DocumentService:
    def __init__(self, repo: DocumentRepository):
        self.repo = repo
        self.chunking_service = ChunkService()


    async def upload(self, file: UploadFile, access_level: str,
                     background_tasks: BackgroundTasks, 
                     department_scope: str, title: str = None) -> Document:
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        UPLOAD_DIR = BASE_DIR / "data" / "uploads"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        uploaded_file_name = f"{uuid.uuid4()}_{file.filename}"
        uploaded_file_path = UPLOAD_DIR / uploaded_file_name
        
        try:
            with open(uploaded_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception:
            raise Exception("Failed to save file to disk")
        finally:
            file.file.close()
            
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
            # meta_data=getattr(file, 'meta_data', None)
        )

        saved_document = await self.repo.create_document(document)

        background_tasks.add_task(
            self._process_document_chunking, 
            document_id=saved_document.id, 
            file_path=str(uploaded_file_path),
            access_level=access_level,
            department_scope=department_scope
        )

        return saved_document
        
    async def _process_document_chunking(
            self, document_id: int, file_path: str, 
            access_level: str, department_scope: str):
        try:
            chunks = await self.chunking_service.hybrid_chunking(doc_path=str(file_path))
            document_chunks = []

            for i, chunk in enumerate(chunks):
                context_content = await self.chunking_service.get_chunk_context(chunk)
                chunk_meta = getattr(chunk, 'meta_data', {}) or {}
                chunk_meta.update({
                    "chunking_strategy": "hybrid",
                    "access_level": access_level,
                    "department": department_scope
                })

                document_chunk = DocumentChunk(
                    chunk_index=i,
                    content=chunk.text,
                    context_content=context_content,
                    embedding_model=self.chunking_service.embedding_model_name,
                    embedding_status=DocumentStatus.DONE,
                    meta_data=chunk_meta
                )

                embedding = await self.chunking_service.embedding_chunking(
                    chunk=chunk
                )

                vector_embedding = VectorEmbedding(
                    embedding=embedding,
                    model_name=self.chunking_service.embedding_model_name,
                    dimensions=self.chunking_service.embedding_model_dimension
                )
                document_chunk.vector_embedding = vector_embedding
                document_chunks.append(document_chunk)
            
            await self.repo.save_chunks(document_id, document_chunks)
            await self.repo.update_document_status(document_id, DocumentStatus.DONE)

        except Exception as e:
            logger.error("document_chunking_failed", document_id=document_id, exc_info=True)
            await self.repo.update_document_status(document_id, DocumentStatus.FAILED)

    