"""Authentication and authorization endpoints for the API.

This module provides endpoints for user login, session management,
and token verification.
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks

from app.models import User
from app.services import (
    AuthService,
    InvalidCredentialsError,
    InvalidTokenError,
    NotFoundError
)
from app.schemas import LoginResponse, LoginForm, RefreshTokenRequest, UserResponse, UserInfoResponse, RefreshTokenResponse
from app.dependencies import get_auth_service, get_current_user
from app.core.logging import logger

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["login"][0])
async def login(
    request: Request, 
    data: LoginForm,
    background_tasks: BackgroundTasks,
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
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else None

        raw_user_agent = request.headers.get("user-agent", "Unknown Agent")
        return await auth_service.login(
            data.employee_code, 
            data.password,
            background_tasks,
            client_ip,
            raw_user_agent,
            data.tenant_domain
        )    
    except InvalidCredentialsError:
        logger.error("login_invalid_credentials", employee_code=data.employee_code, exc_info=True)
        raise HTTPException(
            status_code=401,
            detail="Incorrect credentials",
        )
    except NotFoundError as e:
        logger.error("login_tenant_not_found", error=str(e), exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as ve:
        logger.error("login_validation_failed", error=str(ve), exc_info=True)
        raise HTTPException(status_code=422, detail=str(ve))

@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    request: Request, 
    data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return await auth_service.refresh_token(data)
    except InvalidTokenError:
        logger.error("refresh_token_invalid", exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    except NotFoundError:
        logger.error("user_not_found", exc_info=True)
        raise HTTPException(status_code=404, detail="User not found")
    
@router.post("/logout")
async def logout(
    request: Request,
    data: RefreshTokenRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        user_id = current_user.get("user_id")
        tenant_id = current_user.get("tenant_id")
        client_ip = request.client.host if request.client else None
        
        return await auth_service.logout(
            refresh_token=data.refresh_token, 
            user_id=user_id, 
            tenant_id=tenant_id, 
            client_ip=client_ip, 
            background_tasks=background_tasks
        )
    except NotFoundError:
        logger.error("user_not_found", exc_info=True)
        raise HTTPException(status_code=404, detail="User not found")

@router.get("/me", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["login"][0])
async def get_current_user(
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        user_id = current_user.get("user_id")
        if user_id is None:
            raise InvalidTokenError
        
        return await auth_service.get_current_user(user_id)

    except ValueError as ve:
        logger.error("token_validation_failed", error=str(ve), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

