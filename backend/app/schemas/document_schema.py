from app.schemas import RoleResponse
from app.schemas import UserResponse
from pydantic import BaseModel, ConfigDict, model_validator, field_validator
from datetime import datetime

from app.core.enum import AccessLevel

class DocumentUpdate(BaseModel):
    access_level: AccessLevel | None = None
    department_id: int | None = None
    title: str | None = None
    category: str | None = None
    effective_date: datetime | None = None
    role_access: list[int] | None = None
    target_user_ids: list[int] | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.access_level,
            self.department_id,
            self.title,
            self.category,
            self.effective_date,
            self.role_access,
            self.target_user_ids
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
    
    @field_validator("access_level")
    def validate_access_level(cls, v):
        if v is not None and v not in ["public", "private", "protected"]:
            raise ValueError("Invalid access level")
        return v

class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    context_content: str | None = None
    meta_data: dict | None = None
    embedding_model: str
    embedding_status: str
    embedded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    uploader_id: int
    title: str
    access_level: str
    department_id: int | None = None
    file_name: str
    file_type: str | None = None
    file_path: str
    file_size: int | None = None
    status: str | None = None
    category: str | None = None
    effective_date: datetime | None = None
    meta_data: dict | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    document_chunks: list[DocumentChunkResponse] = []
    target_users: list[UserResponse] = []
    roles: list[RoleResponse] = []

    model_config = ConfigDict(from_attributes=True)