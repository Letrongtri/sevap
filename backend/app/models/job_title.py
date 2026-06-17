import uuid_utils
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class JobTitle(Base):
    __tablename__ = "job_titles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    title_name = Column(String(128), nullable=False)
    code = Column(String(32), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="job_titles")
    users = relationship("User", back_populates="job_title")

    __table_args__ = (
        UniqueConstraint('tenant_id', 'code', name='uq_job_tenant_code'),
        UniqueConstraint('tenant_id', 'title_name', name='uq_job_tenant_title_name'),
    )