from pydantic import BaseModel, ConfigDict, model_validator, Field, AliasChoices
from datetime import datetime

from app.schemas.permission_schema import PermissionResponse
from app.schemas.base_schema import PaginationResponse

# Schema cho dữ liệu gửi lên khi tạo Role
class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    access_level: str
    permission_ids: list[int] = Field(..., validation_alias=AliasChoices("permission_ids", "permissions"))

class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    access_level: str | None = None
    permission_ids: list[int] | None = Field(None, validation_alias=AliasChoices("permission_ids", "permissions"))

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.name,
            self.description,
            self.access_level,
            self.permission_ids,
        ]

        has_value = any(
            v not in (None, "", [])
            for v in values
        )

        if not has_value:
            raise ValueError(
                "At least one field must be provided"
            )

        return self

class RoleSimple(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)

class RoleQuery(BaseModel):
    query: str | None = None
    is_system: bool | None = None

class RoleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: str | None
    access_level: str
    is_system: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    permissions: list[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class RolePaginatedResponse(BaseModel):
    roles: list[RoleResponse]
    pagination: PaginationResponse
