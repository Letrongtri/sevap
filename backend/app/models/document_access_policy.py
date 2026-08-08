import uuid_utils
from sqlalchemy import Column, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class DocumentAccessPolicy(Base):
    __tablename__ = "document_access_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("Document", back_populates="document_access_policies")
    tenant = relationship("Tenants", back_populates="document_access_policies")
    creator = relationship("User", back_populates="created_document_access_policies")
    conditions = relationship("AccessPolicyCondition", back_populates="policy", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_document_access_policy_document", "document_id"),
        Index("idx_document_access_policy_tenant", "tenant_id"),
        Index("idx_document_access_policy_created_by", "created_by"),
    )
