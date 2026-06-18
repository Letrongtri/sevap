from pydantic import BaseModel, ConfigDict, model_validator, field_validator
from datetime import datetime

from app.core.enum import AccessLevel
from app.schemas.department_schema import DepartmentSimple
from app.schemas.role_schema import RoleSimple
from app.schemas.user_schema import UserSimple
from app.schemas.base_schema import PaginationResponse


class DocumentQuery(BaseModel):
    query: str | None = None
    department_id: str | None = None
    access_level: str | None = None
    effective_date: datetime | None = None
    role_id: str | None = None
    user_id: str | None = None

class DocumentUpdate(BaseModel):
    access_level: AccessLevel | None = None
    department_ids: list[str] | None = None
    title: str | None = None
    category: str | None = None
    effective_date: datetime | None = None
    role_access: list[str] | None = None
    target_user_ids: list[str] | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.access_level,
            self.department_ids,
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
        if v is not None and v not in ["public", "private", "managerial"]:
            raise ValueError("Invalid access level")
        return v

class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
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
    id: str
    uploader_id: str
    title: str
    access_level: str
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

    uploader: UserSimple | None = None
    departments: list[DepartmentSimple] = []
    document_chunks: list[DocumentChunkResponse] = []
    target_users: list[UserSimple] = []
    roles: list[RoleSimple] = []

    @model_validator(mode="before")
    @classmethod
    def handle_lazy_loading(cls, data):
        if hasattr(data, "_sa_instance_state"):
            from sqlalchemy import inspect
            state = inspect(data)
            
            loaded_data = {}
            for attr in state.mapper.column_attrs:
                loaded_data[attr.key] = getattr(data, attr.key)
                
            for rel in state.mapper.relationships:
                if rel.key not in state.unloaded:
                    loaded_data[rel.key] = getattr(data, rel.key)
                else:
                    if rel.uselist:
                        loaded_data[rel.key] = []
                    else:
                        loaded_data[rel.key] = None
                        
            # Association proxies checking
            if "user_accesses" not in state.unloaded:
                loaded_data["target_users"] = data.target_users
            else:
                loaded_data["target_users"] = []
                
            if "role_accesses" not in state.unloaded:
                loaded_data["roles"] = data.roles
            else:
                loaded_data["roles"] = []

            if "department_accesses" not in state.unloaded:
                loaded_data["departments"] = data.departments
            else:
                loaded_data["departments"] = []
                
            return loaded_data
        return data

    model_config = ConfigDict(from_attributes=True)

class DocumentPaginatedResponse(BaseModel):
    documents: list[DocumentResponse]
    pagination: PaginationResponse
