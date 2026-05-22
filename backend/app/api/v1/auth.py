"""Authentication and authorization endpoints for the API.

This module provides endpoints for user login, session management,
and token verification.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.user import User
from app.services.auth_service import AuthService
from app.services.exceptions import (
    InvalidCredentialsError,
    InvalidTokenError,
    NotFoundError
)
from app.schemas.auth_schema import Token, TokenResponse, LoginForm
from app.schemas.user_schema import UserResponse
from app.dependencies.auth import get_auth_service
from app.utils.auth import create_access_token, verify_token
from app.utils.sanitization import sanitize_string
from app.core.logging import logger

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=TokenResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["login"][0])
async def login(
    request: Request, 
    data: LoginForm,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login a user.

    Args:
        request: The FastAPI request object for rate limiting.
        employee_code: User's employee code
        password: User's password

    Returns:
        Token: Access token information

    Raises:
        HTTPException: If credentials are invalid
    """
    try:
        user = await auth_service.login(
            data.employee_code, 
            data.password
        )
        
        token = create_access_token(str(user.id))
        return Token(
            access_token=token.access_token, 
            token_type="bearer", 
            expires_at=token.expires_at
        )
    
    except InvalidCredentialsError:
        logger.error("login_invalid_credentials", exc_info=True)
        raise HTTPException(
            status_code=401,
            employee_code=data.employee_code,
            detail="Incorrect credentials",
        )
    except ValueError as ve:
        logger.error("login_validation_failed", error=str(ve), exc_info=True)
        raise HTTPException(status_code=422, detail=str(ve))

@router.get("/me", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["login"][0])
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get the current user ID from the token.

    Args:
        credentials: The HTTP authorization credentials containing the JWT token.

    Returns:
        User: The user extracted from the token.

    Raises:
        HTTPException: If the token is invalid or missing.
    """
    try:
        # Sanitize token
        token = sanitize_string(credentials.credentials)

        user_id = verify_token(token)
        if user_id is None:
            raise InvalidTokenError
        
        return auth_service.get_current_user(user_id)
    except InvalidTokenError or NotFoundError:
        logger.error("invalid_token", token_part=token[:10] + "...")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as ve:
        logger.error("token_validation_failed", error=str(ve), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

