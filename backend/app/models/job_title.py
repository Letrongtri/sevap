from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class JobTitle(Base):
    __tablename__ = "job_titles"

    id = Column(Integer, primary_key=True)
    title_name = Column(String(128), nullable=False, unique=True)
    code = Column(String(32), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    users = relationship("User", back_populates="job_title")