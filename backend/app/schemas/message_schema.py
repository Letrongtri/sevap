from pydantic import BaseModel


class MessageSend(BaseModel):
    content: str