from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False, unique=True)
    code = Column(String(32), nullable=False, unique=True)
    description = Column(Text)
    parent_id = Column(
        Integer, 
        ForeignKey("departments.id", ondelete="CASCADE"), 
        nullable=True
    )
    manager_id = Column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    parent = relationship(
        "Department",
        remote_side=[id],
        back_populates="children"
    )

    children = relationship(
        "Department",
        back_populates="parent",
        cascade="all, delete-orphan"
    )

    users = relationship(
        "User", 
        foreign_keys="User.department_id", 
        back_populates="department"
    )
    manager = relationship(
        "User", 
        foreign_keys=[manager_id], 
        back_populates="managed_department"
    )
    document_accesses = relationship("DocumentDepartmentAccess", back_populates="department")
    