from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime

from app.schemas.user_schema import UserResponse

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

class JobTitleResponse(BaseModel):
    id: int
    title_name: str
    code: str
    description: str | None = None

    created_at: datetime
    updated_at: datetime

    users: list[UserResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
