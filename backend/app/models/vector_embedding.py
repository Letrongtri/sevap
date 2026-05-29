from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class VectorEmbedding(Base):
    __tablename__ = "vector_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    embedding = Column(Vector(1024), nullable=False)
    model_name = Column(String(128))
    dimensions = Column(Integer, nullable=False)
    document_chunk_id = Column(Integer, ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document_chunk = relationship("DocumentChunk", back_populates="vector_embedding", uselist=False)