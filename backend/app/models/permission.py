from sqlalchemy import Column, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.role_permission import RolePermission

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    resource = Column(String(128), nullable=False)
    action = Column(String(32), nullable=False)
    description = Column(Text)

    role_associations = relationship("RolePermission", 
                                     back_populates="permission", 
                                     cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='unique_permission'),
    )