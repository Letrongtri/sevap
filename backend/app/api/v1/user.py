from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Annotated

from app.services import (
    UserService,
    UserAlreadyExistsError,
    InvalidPasswordError,
    NotFoundError
)
from app.schemas import (
    UserCreate, 
    UserResponse, 
    UserUpdate, 
    UserUpdatePassword,
    PaginationQuery,
    UserQuery,
    UserPaginatedResponse,
    UserSimplePaginatedResponse
)
from app.dependencies import get_user_service
from app.core.logging import logger

router = APIRouter()

@router.get("/options", response_model=UserSimplePaginatedResponse)
async def get_user_options(
    request: Request,
    pagination: Annotated[PaginationQuery, Depends()],
    query: str | None = None,
    user_service: UserService = Depends(get_user_service),
):
    """ Get lightweight search options for users. """
    try:
        return await user_service.get_user_options(query, pagination)
    except Exception as exc:
        logger.error(
            "get_user_options_failed",
            query=query, 
            pagination=pagination, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get user options")

@router.get("", response_model=UserPaginatedResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_users(
    request: Request,
    query: Annotated[UserQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    user_service: UserService = Depends(get_user_service),
):
    """ Get all system users.

    Args:
        request: The FastAPI request object for rate limiting.
        query: Query parameters for filtering and pagination
        user_service: User service

    Returns:
        UserPaginatedResponse: User information
    """
    try:
        return await user_service.get_all_users(query, pagination)
    except Exception as exc:
        logger.error(
            "get_all_users_failed",
            query=query, 
            pagination=pagination, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all users")

@router.post("", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_user(
    request: Request, 
    data: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    try:
        return await user_service.create_user(data)
    except UserAlreadyExistsError:
        logger.error("user_already_exists", employee_code=data.employee_code)
        raise HTTPException(status_code=409, detail="User already exists")
    except Exception:
        logger.error(
            "create_user_failed", 
            employee_code=data.employee_code, 
            full_name=data.full_name, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create user")

@router.get("/{user_id}", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_user(
    request: Request, 
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """ Get a user.

    Args:
        request: The FastAPI request object for rate limiting.
        user_id: User's id

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.get_user_by_id(user_id)
    except NotFoundError:
        logger.error("user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        logger.error(
            "get_user_failed",
            user_id=user_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get user")

@router.put("/{user_id}", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_user(
    request: Request,
    user_id: int, 
    data: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    try:
        return await user_service.update_user(user_id=user_id, data=data)
    except NotFoundError:
        logger.error("update_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except UserAlreadyExistsError:
        logger.error("update_user_already_exists", user_id=user_id)
        raise HTTPException(status_code=409, detail="User already exists")
    except Exception:
        logger.error(
            "update_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update user")

@router.delete("/{user_id}", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_user(
    request: Request,
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Delete a user.

    Args:
        request: The FastAPI request object for rate limiting.
        user_id: User's id

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.delete_user(user_id=user_id)
    except NotFoundError:
        logger.error("delete_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        logger.error(
            "delete_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete user")

@router.patch("/{user_id}/activate", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def activate_user(
    request: Request,
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Activate user account.

    Args:
        request: The FastAPI request object for rate limiting.
        user_id: User's id

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.toggle_user_status(user_id=user_id, active=True)
    except NotFoundError:
        logger.error("activate_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        logger.error(
            "activate_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to activate user")

@router.patch("/{user_id}/deactivate", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def deactivate_user(
    request: Request,
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Deactivate user account.

    Args:
        request: The FastAPI request object for rate limiting.
        user_id: User's id

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.toggle_user_status(user_id=user_id, active=False)
    except NotFoundError:
        logger.error("deactivate_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        logger.error(
            "deactivate_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to deactivate user")

@router.patch("/{user_id}/reset-password", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def reset_user_password(
    request: Request,
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Activate user account.

    Args:
        request: The FastAPI request object for rate limiting.
        user_id: User's id

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.reset_user_password(user_id)
    except NotFoundError:
        logger.error("reset_password_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        logger.error(
            "reset_password_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to reset user password")

@router.put("/{user_id}/change-password", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def change_user_password(
    request: Request,
    user_id: int, 
    data: UserUpdatePassword,
    user_service: UserService = Depends(get_user_service),
):
    """Change user password.

    Args:
        request: The FastAPI request object for rate limiting.
        new_password: User's new password
        old_password: User's old password

    Returns:
        UserResponse: User information
    """
    try:
        return await user_service.change_user_password(
            user_id=user_id,
            old_password=data.old_password, 
            new_password=data.new_password, 
        )
    except NotFoundError:
        logger.error("change_password_user_not_found", user_id=user_id)
        raise HTTPException(status_code=404, detail="User not found")
    except InvalidPasswordError:
        logger.error("change_password_user_invalid_password", user_id=user_id)
        raise HTTPException(status_code=404, detail="Invalid password")
    except Exception:
        logger.error(
            "change_password_user_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to change user password")

