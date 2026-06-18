from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.schemas.message_schema import MessageResponse


# Schema cho dữ liệu gửi lên khi cập nhật Conversation
class ConversationUpdate(BaseModel):
    title: str


# Schema cho list endpoint — không bao gồm messages (tránh N+1 và MissingGreenlet)
class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schema cho detail endpoint — bao gồm messages đã được eager-load
class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
