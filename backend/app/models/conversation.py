import uuid_utils
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(128), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message", 
        back_populates="conversation", 
        cascade="all, delete-orphan", 
        passive_deletes=True, 
        order_by="Message.id.desc()"
    )

    __table_args__ = (
        Index("idx_conversations_tenant_user_updated", "tenant_id", "user_id", "updated_at"),
    )
