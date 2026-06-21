import uuid_utils
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid_utils.uuid7()), index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    actor = Column(String(32), nullable=False)
    agent_type = Column(String(32))
    content = Column(Text, nullable=False)
    tool_calls = Column(JSONB)
    confidence_score = Column(Float)
    tool_results = Column(JSONB)
    retrieval_context = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("idx_messages_conversation_created", "conversation_id", "created_at"),
    )