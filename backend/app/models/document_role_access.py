from sqlalchemy import Column, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class DocumentRoleAccess(Base):
    __tablename__ = "document_role_access"

    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    role = relationship("Role", back_populates="document_accesses")
    document = relationship("Document", back_populates="role_accesses")

    __table_args__ = (
        Index("idx_doc_role_access_role", "role_id"),
    )
