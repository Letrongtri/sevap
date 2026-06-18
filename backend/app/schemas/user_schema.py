from __future__ import annotations
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime

from app.utils.sanitization import validate_password_strength
from app.schemas.base_schema import PaginationResponse
from app.schemas.tenant_schema import TenantSimple

if TYPE_CHECKING:
    from app.schemas.role_schema import RoleSimple
    from app.schemas.department_schema import DepartmentSimple
    from app.schemas.job_title_schema import JobTitleSimple

# Schema cho dữ liệu gửi lên khi tạo User
class UserCreate(BaseModel):
    employee_code: str
    full_name: str
    password: str
    email: str | None = None
    job_title_id: str | None = None
    department_id: str | None = None
    role_ids: list[str] | None = None

    @field_validator("password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v
    
class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    job_title_id: str | None = None
    department_id: str | None = None
    role_ids: list[str] | None = None

class UserUpdatePassword(BaseModel):
    new_password: str
    old_password: str

    @field_validator("new_password", "old_password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v

class UserSimple(BaseModel):
    id: str
    employee_code: str
    full_name: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)

class UserQuery(BaseModel):
    query: str | None = None
    department_id: str | None = None
    job_title_id: str | None = None
    role_id: str | None = None
    status: str | None = None

# Schema cho dữ liệu trả về (ẨN MẬT KHẨU)
class UserResponse(BaseModel):
    id: str
    employee_code: str
    full_name: str
    email: str | None
    tenant_id: str
    job_title_id: str | None
    department_id: str | None
    is_active: bool
    is_deleted: bool
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime

    job_title: JobTitleSimple | None = None
    department: DepartmentSimple | None = None
    roles: list[RoleSimple] | None = None
    tenant: TenantSimple | None = None

    model_config = ConfigDict(from_attributes=True) # Cho phép ánh xạ trực tiếp từ SQLAlchemy Model sang Pydantic

class UserPaginatedResponse(BaseModel):
    users: list[UserResponse]
    pagination: PaginationResponse

class UserSimplePaginatedResponse(BaseModel):
    users: list[UserSimple]
    pagination: PaginationResponse

from app.schemas.role_schema import RoleSimple
from app.schemas.department_schema import DepartmentSimple
from app.schemas.job_title_schema import JobTitleSimple
