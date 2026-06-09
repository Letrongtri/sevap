from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.associationproxy import association_proxy
from app.db.base_class import Base
from app.models.document_user_access import DocumentUserAccess
from app.models.document_role_access import DocumentRoleAccess

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    access_level = Column(String(32), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(128), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer)
    status = Column(String(32))
    file_hash = Column(String(64))
    effective_date = Column(DateTime(timezone=True))
    category = Column(String(64))
    meta_data = Column(JSONB) # category, effective_date, target_user_ids (đối với tài liệu private)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    document_chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    uploader = relationship("User", back_populates="documents")
    role_accesses = relationship("DocumentRoleAccess", back_populates="document", cascade="all, delete-orphan")
    embedding_jobs = relationship("EmbeddingJob", back_populates="document", cascade="all, delete-orphan")
    user_accesses = relationship("DocumentUserAccess", back_populates="document", cascade="all, delete-orphan")
    
    target_users = association_proxy("user_accesses", "user", creator=lambda u: DocumentUserAccess(user=u))
    roles = association_proxy("role_accesses", "role", creator=lambda r: DocumentRoleAccess(role=r))
    