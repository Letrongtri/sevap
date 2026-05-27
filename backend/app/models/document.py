from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    access_level = Column(String(32), nullable=False)
    department_scope = Column(String(64))
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(32))
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer)
    status = Column(String(32))
    meta_data = Column(JSONB)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    document_chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    uploader = relationship("User", back_populates="documents")
    roles = relationship("Role", secondary="document_role_access", back_populates="documents")
    