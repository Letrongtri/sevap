from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime

from app.schemas.permission_schema import PermissionResponse

# Schema cho dữ liệu gửi lên khi tạo Role
class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    access_level: str
    permissions: list[int]

class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    access_level: str | None = None
    permissions: list[int] | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.name,
            self.description,
            self.access_level,
            self.permissions,
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
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    access_level: str
    is_system: bool
    created_at: datetime
    updated_at: datetime

    permissions: list[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)

    