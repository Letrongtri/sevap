from fastapi import APIRouter, HTTPException, Depends, Request

from app.services.user_service import UserService
from app.services.exceptions import (
    UserAlreadyExistsError,
    InvalidTokenError,
    NotFoundError
)
from app.schemas.user_schema import UserCreate, UserResponse
from app.dependencies.user import get_user_service
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=UserResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_user(
    request: Request, 
    data: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    """Create a user.

    Args:
        request: The FastAPI request object for rate limiting.
        employee_code: User's employee code
        full_name: User's full name
        password: User's password
        email: User's email

    Returns:
        UserResponse: User information
    """
    try:
        user = await user_service.create_user(
            employee_code=data.employee_code, 
            full_name=data.full_name, 
            password=data.password,
            email=data.email,
        )
        
        return UserResponse.model_validate(user)
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
