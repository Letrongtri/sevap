import uuid_utils
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, UniqueConstraint, Index, Computed
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from app.db.base_class import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    content = Column(Text, nullable=False)
    content_tsv = Column(
        TSVECTOR,
        Computed("to_tsvector('simple', immutable_unaccent(content))", persisted=True)
    )

    meta_data = Column(JSONB)
    embedding_model = Column(String(128), index=True)
    embedding_status = Column(String(32), index=True)
    chunk_index = Column(Integer, nullable=False)
    embedded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="document_chunks")
    document = relationship("Document", back_populates="document_chunks")
    vector_embedding = relationship("VectorEmbedding", back_populates="document_chunk", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('document_id', 'chunk_index', name='unique_document_chunk_index'),
        Index("idx_document_chunks_tenant", "tenant_id"),
    )
