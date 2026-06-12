from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class DocumentDepartmentAccess(Base):
    __tablename__ = "document_department_access"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="document_accesses")
    document = relationship("Document", back_populates="department_accesses")
