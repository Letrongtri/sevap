import uuid_utils
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Boolean, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    
    action = Column(String(128), nullable=False)
    resource = Column(String(128))
    meta_data = Column(JSONB)
    ip_address = Column(String(64))
    log_level = Column(String(32), default="INFO", nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="activity_logs")
    user = relationship("User", back_populates="activity_logs")

    __table_args__ = (
        # Index cho global admin where tenant_id is null
        Index(
            "idx_activity_logs_global_created",
            "created_at",
            postgresql_where=text("tenant_id IS NULL")
        ),
        # Index cho tenant admin where tenant_id is not null
        Index(
            "idx_activity_logs_tenant_created",
            "tenant_id",
            "created_at",
            postgresql_where=text("tenant_id IS NOT NULL")
        ),
        Index("idx_activity_logs_user", "user_id"),
    )