from pydantic import BaseModel, ConfigDict
from datetime import datetime


# Schema cho dữ liệu gửi lên khi tạo Conversation
class ConversationCreate(BaseModel):
    title: str | None = None

class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    # messages: list[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
