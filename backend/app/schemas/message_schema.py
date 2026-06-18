from pydantic import ConfigDict, BaseModel
from datetime import datetime

class MessageSend(BaseModel):
    conversation_id: str | None = None
    content: str

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    actor: str
    agent_type: str | None = None
    content: str
    tool_calls: list[dict] | dict | None = None
    confidence_score: float | None = None
    tool_results: list[dict] | dict | None = None
    retrieval_context: list[dict] | dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
