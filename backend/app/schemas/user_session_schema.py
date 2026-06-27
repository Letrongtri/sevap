from pydantic import BaseModel, ConfigDict
from app.schemas.base_schema import PaginationResponse

class UserSessionResponse(BaseModel):
    id: str
    user_id: str
    tenant_id: str | None
    ip_address: str
    user_agent: str
    device: str
    location: str
    status: str
    is_current: bool
    is_revoked: bool

    model_config = ConfigDict(from_attributes=True)


class UserSessionPaginatedResponse(BaseModel):
    sessions: list[UserSessionResponse]
    pagination: PaginationResponse
