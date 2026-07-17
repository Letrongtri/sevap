from pydantic import BaseModel, ConfigDict, field_validator
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

class UserSessionAdminResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    roles: list[str]
    tenant_id: str | None
    ip_address: str
    user_agent: str
    device: str
    location: str
    status: str
    is_revoked: bool

    model_config = ConfigDict(from_attributes=True)

class UserSessionAdminPaginatedResponse(BaseModel):
    sessions: list[UserSessionAdminResponse]
    pagination: PaginationResponse

class UserSessionAdminQuery(BaseModel):
    user_id: str | None = None
    status: str | None = None

    @field_validator("status")
    def validate_status(cls, v):
        if v is None:
            return v

        if v not in ["active", "inactive"]:
            raise ValueError("Status must be active or inactive")
        return v
