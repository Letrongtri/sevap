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
    name: str
    description: str | None
    type: PromptType
    content: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PromptTemplatePaginatedResponse(BaseModel):
    prompt_templates: list[PromptTemplateResponse]
    pagination: PaginationResponse
