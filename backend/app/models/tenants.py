import uuid_utils
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Tenants(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    company_description = Column(Text)
    company_email = Column(String(255), unique=True, nullable=False)
    company_phone = Column(String(16), unique=True, nullable=False)
    company_address = Column(String(255), unique=True, nullable=False)
    tenant_domain = Column(String(255), unique=True)
    status = Column(String(32), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="tenant", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="tenant", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="tenant", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="tenant", cascade="all, delete-orphan")
    job_titles = relationship("JobTitle", back_populates="tenant", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="tenant", cascade="all, delete-orphan")
    prompt_templates = relationship("PromptTemplate", back_populates="tenant", cascade="all, delete-orphan")
    user_sessions = relationship("UserSession", back_populates="tenant", cascade="all, delete-orphan")
    document_chunks = relationship("DocumentChunk", back_populates="tenant", cascade="all, delete-orphan")
    vector_embeddings = relationship("VectorEmbedding", back_populates="tenant", cascade="all, delete-orphan")

