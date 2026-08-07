from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from app.core.enum import PromptType
from app.schemas.base_schema import PaginationResponse

class PromptTemplateCreate(BaseModel):
    name: str
    type: PromptType
    content: str | None = None
    description: str | None = None

class PromptTemplateUpdate(BaseModel):
    name: str | None = None
    type: PromptType | None = None
    content: str | None = None
    description: str | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.name,
            self.description,
            self.type,
            self.content,
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

class PromptTemplateQuery(BaseModel):
    query: str | None = None
    type: PromptType | None = None
    is_active: bool | None = None

class PromptTemplateResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_employee_code: str | None = None
    name: str
    description: str | None
    type: PromptType
    content: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_user_info(cls, data):
        if hasattr(data, "_sa_instance_state"):
            from sqlalchemy import inspect
            state = inspect(data)
            if "user" not in state.unloaded:
                user = getattr(data, "user", None)
                if user is not None:
                    if not getattr(data, "user_name", None):
                        setattr(data, "user_name", getattr(user, "full_name", None))
                    if not getattr(data, "user_employee_code", None):
                        setattr(data, "user_employee_code", getattr(user, "employee_code", None))
        elif isinstance(data, dict):
            user = data.get("user")
            if isinstance(user, dict):
                data.setdefault("user_name", user.get("full_name"))
                data.setdefault("user_employee_code", user.get("employee_code"))
            elif user is not None:
                data.setdefault("user_name", getattr(user, "full_name", None))
                data.setdefault("user_employee_code", getattr(user, "employee_code", None))
        return data

    model_config = ConfigDict(from_attributes=True)

class PromptTemplatePaginatedResponse(BaseModel):
    prompt_templates: list[PromptTemplateResponse]
    pagination: PaginationResponse
