import uuid_utils
from sqlalchemy import Column, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class AccessPolicyCondition(Base):
    __tablename__ = "access_policy_conditions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    policy_id = Column(String(36), ForeignKey("document_access_policies.id", ondelete="CASCADE"), index=True)
    condition_type = Column(String(32), nullable=False)
    condition_value_id = Column(String(36), nullable=False)

    policy = relationship("DocumentAccessPolicy", back_populates="conditions")

    __table_args__ = (
        Index("idx_access_policy_condition_policy", "policy_id"),
    )
