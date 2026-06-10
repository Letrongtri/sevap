from fastapi import APIRouter, HTTPException, Depends, Request

from app.services import PermissionService
from app.schemas import PermissionResponse
from app.dependencies import get_permission_service
from app.core.logging import logger

router = APIRouter()

@router.get("", response_model=list[PermissionResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_permissions(
    request: Request,
    permission_service: PermissionService = Depends(get_permission_service),
):
    try:
        return await permission_service.get_all_permissions()
    except Exception:
        logger.error(
            "get_all_permissions_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all permissions")
