from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from app.schemas.base_schema import PaginationResponse

class JobTitleCreate(BaseModel):
    title_name: str
    code: str
    description: str | None = None

class JobTitleUpdate(BaseModel):
    title_name: str | None = None
    description: str | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.title_name,
            self.description
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

class JobTitleSimple(BaseModel):
    id: str
    title_name: str
    code: str

    model_config = ConfigDict(from_attributes=True)

class JobTitleResponse(BaseModel):
    id: str
    tenant_id: str
    title_name: str
    code: str
    description: str | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobTitleQuery(BaseModel):
    query: str | None = None

class JobTitlePaginatedResponse(BaseModel):
    job_titles: list[JobTitleResponse]
    pagination: PaginationResponse

    model_config = ConfigDict(from_attributes=True)