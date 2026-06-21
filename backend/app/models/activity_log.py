import uuid_utils
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    action = Column(String(128), nullable=False)
    resource = Column(String(128))
    meta_data = Column(Text)
    ip_address = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="activity_logs")
    user = relationship("User", back_populates="activity_logs")

    __table_args__ = (
        Index("idx_activity_logs_tenant_created", "tenant_id", "created_at"),
        Index("idx_activity_logs_user", "user_id"),
    )