from typing import List
from datetime import datetime
from app.models import DocumentChunk, VectorEmbedding
from app.core.enum import DocumentStatus
from app.core.logging import logger
from app.ai_brain.chunking import document_chunker
from app.ai_brain.embeddings import document_embedder
from app.db.session import AsyncSessionLocal

async def process_document_chunking_task(
    tenant_id: str, document_id: str, 
    file_path: str, access_level: str, 
    category: str = None, effective_date: datetime = None
):
    """
    Background task: Chunking và embedding tài liệu.
    Dùng session DB mới (không dùng session đã đóng của request).
    """
    try:
        chunks_doc = await document_chunker.chunking_to_documents(doc_path=str(file_path))
        document_chunks = []

        for i, chunk in enumerate(chunks_doc):
            serialized_text = chunk.page_content
            source_metadata = chunk.metadata
            extended_metadata = source_metadata.copy()
            extended_metadata.update({
                "category": category,
                "effective_date": (
                    effective_date.strftime("%Y-%m-%d") 
                    if effective_date is not None else None
                ),
                "access_level": access_level
            })

            document_chunk = DocumentChunk(
                tenant_id=tenant_id,
                document_id=document_id,
                chunk_index=i,
                content=serialized_text,
                embedding_model=document_embedder.embedding_model_name,
                embedding_status=DocumentStatus.DONE,
                meta_data=extended_metadata
            )

            embedding = await document_embedder.embed(serialized_text)

            vector_embedding = VectorEmbedding(
                tenant_id=tenant_id,
                embedding=embedding,
                model_name=document_embedder.embedding_model_name,
                dimensions=document_embedder.embedding_model_dimension
            )
            document_chunk.vector_embedding = vector_embedding
            document_chunks.append(document_chunk)
        
        # Dùng session mới hoàn toàn độc lập với request session
        async with AsyncSessionLocal() as session:
            from app.repositories import DocumentRepository as _DocRepo
            bg_repo = _DocRepo(session)
            await bg_repo.save_chunks(document_chunks)
            await bg_repo.update_document_status(document_id, DocumentStatus.DONE)

    except Exception:
        logger.error(
            "document_chunking_failed", 
            document_id=document_id, 
            exc_info=True
        )
        async with AsyncSessionLocal() as session:
            from app.repositories import DocumentRepository as _DocRepo
            bg_repo = _DocRepo(session)
            await bg_repo.update_document_status(document_id, DocumentStatus.FAILED)


async def sync_chunk_metadata_task(
    tenant_id: str, document_id: str, access_level: str,
    category: str = None, effective_date: datetime = None
):
    """
    Background task: Chỉ đồng bộ lại metadata của các Chunk
    khi tài liệu thay đổi cấu hình. Dùng session DB mới độc lập với request session.
    """
    try:
        async with AsyncSessionLocal() as session:
            from app.repositories import DocumentRepository as _DocRepo
            bg_repo = _DocRepo(session)

            chunks = await bg_repo.get_chunks_by_document_id(tenant_id, document_id)
            
            for chunk in chunks:
                chunk_meta = chunk.meta_data or {}
                chunk_meta.update({
                    "category": category,
                    "effective_date": effective_date.strftime("%Y-%m-%d") if effective_date else None,
                    "access_level": access_level
                })
                chunk.meta_data = chunk_meta
            
            await bg_repo.bulk_update_chunks(chunks)
            logger.info(
                "chunk_metadata_synced",
                document_id=document_id,
                chunk_count=len(chunks)
            )
            
    except Exception:
        logger.error(
            "chunk_metadata_sync_failed",
            document_id=document_id,
            exc_info=True
        )