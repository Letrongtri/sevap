from pydantic import BaseModel


class MessageSend(BaseModel):
    conversation_id: int | None = None
    content: str