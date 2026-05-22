from pydantic import BaseModel, Field, field_validator
from app.utils.sanitization import validate_password_strength
from datetime import datetime

# Schema cho JWT Token
class Token(BaseModel):
    access_token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of the token")
    expires_at: datetime = Field(..., description="The expiration date of the token")

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of the token")
    expires_at: datetime = Field(..., description="The expiration date of the token")

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
