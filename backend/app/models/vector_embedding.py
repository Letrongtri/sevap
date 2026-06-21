import uuid_utils
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Index
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class VectorEmbedding(Base):
    __tablename__ = "vector_embeddings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    document_chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    embedding = Column(Vector(1024), nullable=False)
    model_name = Column(String(128))
    dimensions = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="vector_embeddings")
    document_chunk = relationship("DocumentChunk", back_populates="vector_embedding")

    __table_args__ = (
        Index(
            "idx_vector_embeddings_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("idx_vector_embeddings_chunk", "document_chunk_id"),
        Index("idx_vector_embeddings_tenant", "tenant_id"),
    )