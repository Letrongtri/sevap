"""Authentication and authorization endpoints for the API.

This module provides endpoints for user login, session management,
and token verification.
"""

from fastapi import APIRouter, HTTPException, Depends, Request

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
        client_ip = request.client.host if request.client else None
        user, access_token, refresh_token = await auth_service.login(
            data.employee_code, 
            data.password,
            client_ip
        )

        user_roles = []
        for role in user.role_associations:
            user_roles.append(role.role.name)
        
        user_info = UserInfoResponse(
            id=user.id,
            full_name=user.full_name,
            employee_code=user.employee_code,
            roles=user_roles,
            department=user.department.name if user.department else "",
            job_title=user.job_title.title_name if user.job_title else "",
            last_login=user.last_login,
        )

        return LoginResponse(
            token_type="bearer", 
            access_token=access_token.token, 
            access_token_expires_at=access_token.expires_at,
            refresh_token=refresh_token.token,
            refresh_token_expires_at=refresh_token.expires_at,
            user=user_info
        )
    
    except InvalidCredentialsError:
        logger.error("login_invalid_credentials", employee_code=data.employee_code, exc_info=True)
        raise HTTPException(
            status_code=401,
            detail="Incorrect credentials",
        )
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
        new_access_token = await auth_service.refresh_token(data.refresh_token)
        return RefreshTokenResponse(
            access_token=new_access_token.token,
            access_token_expires_at=new_access_token.expires_at,
            token_type="bearer"
        )
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
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        await auth_service.logout(data.refresh_token)
        return {"message": "Logout successful"}
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
        
        return await auth_service.get_current_user(int(user_id))

    except ValueError as ve:
        logger.error("token_validation_failed", error=str(ve), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

