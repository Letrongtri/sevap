from pydantic import BaseModel, Field, field_validator
from app.utils.sanitization import validate_password_strength
from datetime import datetime

class UserInfoResponse(BaseModel):
    id: str = Field(..., description="The unique identifier of the user")
    full_name: str = Field(..., description="The full name of the user")
    employee_code: str = Field(..., description="The employee code of the user")
    roles: list[str] = Field(..., description="The roles of the user")
    department: str = Field(..., description="The department of the user")
    job_title: str = Field(..., description="The job title of the user")
    tenant_id: str = Field(..., description="The tenant id of the user")
    tenant_domain: str = Field(..., description="The tenant domain of the user")
    company_name: str = Field(..., description="The company name of the user")
    last_login: datetime = Field(..., description="The last login date of the user")

# Schema cho JWT Token
class Token(BaseModel):
    jti: str = Field(..., description="The unique identifier of the token")
    token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of the token")
    expires_at: datetime = Field(..., description="The expiration date of the token")

class LoginResponse(BaseModel):
    token_type: str = Field(default="bearer", description="The type of the token")
    access_token: str = Field(..., description="The JWT access token")
    access_token_expires_at: datetime = Field(..., description="The expiration date of the token")
    refresh_token: str = Field(..., description="The JWT refresh token")
    refresh_token_expires_at: datetime = Field(..., description="The expiration date of the token")
    user: UserInfoResponse = Field(..., description="The information of the user")

    class Config:
        from_attributes = True # Cho phép ánh xạ trực tiếp từ SQLAlchemy Model sang Pydantic


class LoginForm(BaseModel):
    tenant_domain: str = Field(..., description="The tenant domain of the user")
    employee_code: str = Field(..., description="The employee code of the user")
    password: str = Field(..., description="The password of the user")

    @field_validator("password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v

class RefreshTokenRequest(BaseModel):
    tenant_domain: str = Field(..., description="The tenant domain of the user")
    refresh_token: str = Field(..., description="The JWT refresh token")

class RefreshTokenResponse(BaseModel):
    token_type: str = Field(default="bearer", description="The type of the token")
    access_token: str = Field(..., description="The JWT access token")
    access_token_expires_at: datetime = Field(..., description="The expiration date of the token")

