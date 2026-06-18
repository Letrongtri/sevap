from __future__ import annotations
from pydantic import BaseModel, ConfigDict, model_validator, Field, field_validator
from datetime import datetime
from app.core.enum import TenantStatus
from app.utils.sanitization import validate_password_strength

class TenantCreate(BaseModel):
    # Tenant details
    tenant_domain: str = Field(..., max_length=255)
    company_name: str = Field(..., max_length=255)
    company_description: str | None = None
    company_email: str = Field(..., max_length=255)
    company_phone: str = Field(..., max_length=16)
    company_address: str = Field(..., max_length=255)

    # Tenant first Admin details
    admin_employee_code: str = Field(..., max_length=64)
    admin_full_name: str = Field(..., max_length=128)
    admin_email: str = Field(..., max_length=255)
    admin_password: str = Field(..., max_length=255)

    @field_validator("admin_password")
    @classmethod
    def validate_admin_password(cls, v):
        validate_password_strength(v)
        return v

class TenantUpdate(BaseModel):
    company_name: str | None = Field(None, max_length=255)
    company_description: str | None = None
    company_email: str | None = Field(None, max_length=255)
    company_phone: str | None = Field(None, max_length=16)
    company_address: str | None = Field(None, max_length=255)
    tenant_domain: str | None = Field(None, max_length=255)
    status: TenantStatus | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        values = [
            self.company_name,
            self.company_description,
            self.company_email,
            self.company_phone,
            self.company_address,
            self.tenant_domain,
            self.status,
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

class TenantSimple(BaseModel):
    id: str
    company_name: str
    tenant_domain: str | None

    model_config = ConfigDict(from_attributes=True)

class TenantResponse(BaseModel):
    id: str
    tenant_domain: str
    company_name: str
    company_description: str | None = None
    company_email: str
    company_phone: str
    company_address: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
