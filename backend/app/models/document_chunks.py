from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    context_content = Column(Text)
    meta_data = Column(JSONB)
    embedding_model = Column(String(128), index=True)
    embedding_status = Column(String(32), index=True)
    chunk_index = Column(Integer, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    embedded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("Document", back_populates="document_chunks")
    vector_embedding = relationship("VectorEmbedding", back_populates="document_chunk", uselist=False)

    __table_args__ = (
        UniqueConstraint('document_id', 'chunk_index', name='unique_document_chunk_index'),
    )
