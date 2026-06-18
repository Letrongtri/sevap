import uuid_utils
from sqlalchemy import Column, ForeignKey, String, Boolean, DateTime, Index, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.user_role import UserRole

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    employee_code = Column(String(64), index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    email = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    job_title_id = Column(String(36), ForeignKey("job_titles.id"), nullable=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    last_login = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="users")
    role_associations = relationship("UserRole", foreign_keys=[UserRole.user_id], back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="uploader", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    user_sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    prompt_templates = relationship("PromptTemplate", back_populates="user", cascade="all, delete-orphan")
    embedding_jobs = relationship("EmbeddingJob", back_populates="user", cascade="all, delete-orphan")
    department = relationship(
        "Department", 
        foreign_keys="User.department_id", 
        back_populates="users"
    )
    job_title = relationship("JobTitle", back_populates="users")
    document_accesses = relationship("DocumentUserAccess", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("uq_user_tenant_employee_code_active", "tenant_id", "employee_code", unique=True, postgresql_where=text("is_deleted = false")),
        Index("uq_user_tenant_email_active", "tenant_id", "email", unique=True, postgresql_where=text("is_deleted = false")),
    )

