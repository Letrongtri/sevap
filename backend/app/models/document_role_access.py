from sqlalchemy import Column, Integer, ForeignKey
from app.db.base_class import Base

class DocumentRoleAccess(Base):
    __tablename__ = "document_role_access"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
