from __future__ import annotations
from typing import TYPE_CHECKING
from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime

if TYPE_CHECKING:
    from app.schemas.user_schema import UserResponse

# Schema cho dữ liệu gửi lên khi tạo Department
class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    parent_id: int | None = None
    manager_id: int | None = None

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_id: int | None = None
    manager_id: int | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.name,
            self.description,
            self.parent_id,
            self.manager_id,
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

class DepartmentSimple(BaseModel):
    id: int
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None = None

    parent_id: int | None = None
    manager_id: int | None = None

    created_at: datetime
    updated_at: datetime

    parent: DepartmentSimple | None = None
    children: list[DepartmentSimple] = Field(default_factory=list)

    manager: UserResponse | None = None
    users: list[UserResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

from app.schemas.user_schema import UserResponse