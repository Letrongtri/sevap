from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class EmbeddingJob(Base):
    __tablename__ = "embedding_jobs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    triggered_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(32))
    total_chunks = Column(Integer, default=0)
    processed_chunks = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("Document", back_populates="embedding_jobs")
    user = relationship("User", back_populates="embedding_jobs")

    __table_args__ = (
        Index("idx_embedding_jobs_doc", "document_id"),
        Index("idx_embedding_jobs_user", "triggered_by"),
        Index("idx_embedding_jobs_status", "status"),
    )
    