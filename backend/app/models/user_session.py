import uuid_utils
from sqlalchemy import Column, DateTime, ForeignKey, String, func, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    
    jti = Column(String(256), nullable=False)
    ip_address = Column(String(64))
    user_agent = Column(String(512))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tenant = relationship("Tenants", back_populates="user_sessions")
    user = relationship("User", back_populates="user_sessions")

    __table_args__ = (
        Index("idx_user_sessions_jti", "jti", unique=True),
        Index("idx_user_sessions_tenant_user", "tenant_id", "user_id"),
    )
