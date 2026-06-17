import uuid_utils
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(128), nullable=False)
    code = Column(String(32), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="departments")
    users = relationship(
        "User", 
        foreign_keys="User.department_id", 
        back_populates="department"
    )
    document_accesses = relationship("DocumentDepartmentAccess", back_populates="department", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('tenant_id', 'code', name='uq_dept_tenant_code'),
        UniqueConstraint('tenant_id', 'name', name='uq_dept_tenant_name'),
    )