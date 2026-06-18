import uuid_utils
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func, Index, text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(128), nullable=False)
    code = Column(String(32), nullable=False)
    description = Column(Text)
    is_deleted = Column(Boolean, default=False, nullable=False)
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
        Index("uq_dept_tenant_code_active", "tenant_id", "code", unique=True, postgresql_where=text("is_deleted = false")),
        Index("uq_dept_tenant_name_active", "tenant_id", "name", unique=True, postgresql_where=text("is_deleted = false")),
    )