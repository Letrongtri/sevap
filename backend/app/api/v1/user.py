from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from typing import Annotated

from app.services import (
    UserService,
    UserAlreadyExistsError,
    InvalidPasswordError,
    NotFoundError,
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
from app.dependencies import get_user_service, check_permission
from app.core.enum import PermissionResource, PermissionAction
from app.decorators import log_activity
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/options", 
    response_model=UserSimplePaginatedResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.READ
    ))]
)
async def get_user_options(
    request: Request,
    pagination: Annotated[PaginationQuery, Depends()],
    query: str | None = None,
    user_service: UserService = Depends(get_user_service),
):
    """ Get lightweight search options for users. """
    try:
        tenant_id = request.state.tenant_id
        return await user_service.get_user_options(tenant_id, query, pagination)
    except Exception as exc:
        logger.error(
            "get_user_options_failed",
            tenant_id=tenant_id,  
            query=query, 
            pagination=pagination, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get user options")

@router.get(
    "", 
    response_model=UserPaginatedResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.READ
    ))]
)
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
        tenant_id = request.state.tenant_id
        return await user_service.get_all_users(tenant_id, query, pagination)
    except Exception as exc:
        logger.error(
            "get_all_users_failed",
            tenant_id=tenant_id,  
            query=query, 
            pagination=pagination, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all users")

@router.post(
    "", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.CREATE
    ))]
)
@log_activity(
    action="user.create",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "created_user_id": res.id, 
        "employee_code": res.employee_code, 
        "full_name": res.full_name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_user(
    request: Request, 
    data: UserCreate,
    background_tasks: BackgroundTasks,
    user_service: UserService = Depends(get_user_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await user_service.create_user(tenant_id, data)
    except UserAlreadyExistsError:
        logger.error("user_already_exists", employee_code=data.employee_code)
        raise HTTPException(status_code=409, detail="User already exists")
    except Exception:
        logger.error(
            "create_user_failed",
            tenant_id=tenant_id,  
            employee_code=data.employee_code, 
            full_name=data.full_name, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create user")

@router.get(
    "/{user_id}", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_user(
    request: Request, 
    user_id: str,
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
        tenant_id = request.state.tenant_id
        return await user_service.get_user_by_id(tenant_id, user_id)
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

@router.put(
    "/{user_id}", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="user.update",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "updated_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_user(
    request: Request,
    user_id: str, 
    data: UserUpdate,
    background_tasks: BackgroundTasks,
    user_service: UserService = Depends(get_user_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await user_service.update_user(tenant_id, user_id, data)
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

@router.delete(
    "/{user_id}", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="user.delete",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "deleted_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_user(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks,
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
        tenant_id = request.state.tenant_id
        return await user_service.delete_user(tenant_id, user_id)
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

@router.patch(
    "/{user_id}/activate", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.SUSPEND
    ))]
)
@log_activity(
    action="user.activate",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "target_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def activate_user(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks,
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
        tenant_id = request.state.tenant_id
        return await user_service.toggle_user_status(tenant_id, user_id, True)
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

@router.patch(
    "/{user_id}/deactivate", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.SUSPEND
    ))]
)
@log_activity(
    action="user.deactivate",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "target_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def deactivate_user(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks,
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
        tenant_id = request.state.tenant_id
        return await user_service.toggle_user_status(tenant_id, user_id, False)
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

@router.patch(
    "/{user_id}/reset-password", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.SUSPEND
    ))]
)
@log_activity(
    action="user.reset_password",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "target_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def reset_user_password(
    request: Request,
    user_id: str,
    background_tasks: BackgroundTasks,
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
        tenant_id = request.state.tenant_id
        return await user_service.reset_user_password(tenant_id, user_id)
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

@router.put(
    "/{user_id}/change-password", 
    response_model=UserResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="user.change_password",
    resource="user",
    meta_extractor=lambda res, *args, **kwargs: {
        "target_user_id": kwargs.get("user_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def change_user_password(
    request: Request,
    user_id: str, 
    data: UserUpdatePassword,
    background_tasks: BackgroundTasks,
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
        tenant_id = request.state.tenant_id
        return await user_service.change_user_password(
            tenant_id, user_id,
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

