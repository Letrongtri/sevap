from pydantic import BaseModel, Field, field_validator
from app.utils.sanitization import validate_password_strength
from datetime import datetime

# Schema cho JWT Token
class Token(BaseModel):
    jti: str = Field(..., description="The unique identifier of the token")
    token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of the token")
    expires_at: datetime = Field(..., description="The expiration date of the token")

class TokenResponse(BaseModel):
    token_type: str = Field(default="bearer", description="The type of the token")
    access_token: str = Field(..., description="The JWT access token")
    access_token_expires_at: datetime = Field(..., description="The expiration date of the token")
    refresh_token: str = Field(..., description="The JWT refresh token")
    refresh_token_expires_at: datetime = Field(..., description="The expiration date of the token")

    class Config:
        from_attributes = True # Cho phép ánh xạ trực tiếp từ SQLAlchemy Model sang Pydantic


class LoginForm(BaseModel):
    employee_code: str = Field(..., description="The employee code of the user")
    password: str = Field(..., description="The password of the user")

    @field_validator("password")
    @classmethod
    def sanitize(cls, v):
        validate_password_strength(v)
        return v

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="The JWT refresh token")
