from sqlalchemy import Column, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class DocumentUserAccess(Base):
    __tablename__ = "document_user_access"

    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="document_accesses")
    document = relationship("Document", back_populates="user_accesses")

    __table_args__ = (
        Index("idx_doc_user_access_user", "user_id"),
    )
