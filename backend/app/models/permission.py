from sqlalchemy import Column, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    resource = Column(String(128), nullable=False)
    action = Column(String(32), nullable=False)
    description = Column(Text)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
    
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='unique_permission'),
    )