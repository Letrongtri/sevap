import uuid_utils
from sqlalchemy import Column, ForeignKey, String, Boolean, DateTime, Integer, Index, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.associationproxy import association_proxy
from app.db.base_class import Base
from app.models.document_user_access import DocumentUserAccess

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    access_level = Column(String(32), nullable=False)
    file_name = Column(String(512), nullable=False)
    file_type = Column(String(256), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(Integer)
    status = Column(String(32))
    file_hash = Column(String(512))
    effective_date = Column(DateTime(timezone=True))
    category = Column(String(64))
    meta_data = Column(JSONB) # category, effective_date, target_user_ids (đối với tài liệu private)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="documents")
    uploader = relationship("User", back_populates="documents")
    document_chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    embedding_jobs = relationship("EmbeddingJob", back_populates="document", cascade="all, delete-orphan")
    user_accesses = relationship("DocumentUserAccess", back_populates="document", cascade="all, delete-orphan")
    document_access_policies = relationship("DocumentAccessPolicy", back_populates="document", cascade="all, delete-orphan")
    
    target_users = association_proxy("user_accesses", "user", creator=lambda u: DocumentUserAccess(user=u))

    __table_args__ = (
        Index(
            "uq_document_tenant_file_hash_active", 
            "tenant_id", 
            "file_hash", 
            unique=True, 
            postgresql_where=text("is_deleted = false AND file_hash IS NOT NULL")
        ),
        Index("idx_documents_tenant_deleted", "tenant_id", "is_deleted"),
        Index("idx_documents_uploader", "uploader_id"),
    )

    