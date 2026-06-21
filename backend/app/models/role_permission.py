from sqlalchemy import Column, Integer, String, ForeignKey, Index
from app.db.base_class import Base

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        Index("idx_role_permissions_permission", "permission_id"),
    )
