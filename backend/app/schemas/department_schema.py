from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime

# Schema cho dữ liệu gửi lên khi tạo Department
class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str | None = None

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.name,
            self.description,
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
    id: str
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)

class DepartmentResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str
    description: str | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
