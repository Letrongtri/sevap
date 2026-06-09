from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models import UserRole

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    job_title_id = Column(Integer, ForeignKey("job_titles.id"), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    last_login = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    role_associations = relationship("UserRole", foreign_keys=[UserRole.user_id], back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user")
    documents = relationship("Document", back_populates="uploader")
    activity_logs = relationship("ActivityLog", back_populates="user")
    embedding_jobs = relationship("EmbeddingJob", back_populates="user", cascade="all, delete-orphan")
    user_sessions = relationship("UserSession", back_populates="user")
    department = relationship(
        "Department", 
        foreign_keys="User.department_id", 
        back_populates="users"
    )
    managed_department = relationship(
        "Department",
        foreign_keys="Department.manager_id",
        back_populates="manager"
    )
    job_title = relationship("JobTitle", back_populates="users")
    document_accesses = relationship("DocumentUserAccess", back_populates="user", cascade="all, delete-orphan")
