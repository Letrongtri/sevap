from pydantic import BaseModel, EmailStr, field_validator
from app.utils.sanitization import validate_password_strength
from datetime import datetime

# Schema cho dữ liệu gửi lên khi tạo User
class UserCreate(BaseModel):
    employee_code: str
    full_name: str
    password: str
    email: EmailStr | None = None

    @field_validator("password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v
    
class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None

class UserUpdatePassword(BaseModel):
    new_password: str
    old_password: str

    @field_validator("new_password", "old_password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v

# Schema cho dữ liệu trả về (ẨN MẬT KHẨU)
class UserResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: EmailStr | None
    is_active: bool
    is_deleted: bool
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Cho phép ánh xạ trực tiếp từ SQLAlchemy Model sang Pydantic
