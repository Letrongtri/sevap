from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

from app.services import ActivityLogService
from app.schemas import (
    ActivityLogQuery,
    ActivityLogPaginatedResponse,
    ActivityLogResponse,
    PaginationQuery
)
from app.dependencies import get_activity_log_service, check_permission
from app.core.logging import logger
from app.core.enum import PermissionAction, PermissionResource

router = APIRouter()

@router.get(
    "", 
    response_model=ActivityLogPaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.ACTIVITY_LOGS, PermissionAction.READ,
        require_global_admin=True
    ))]
)
async def get_global_activity_logs(
    query: Annotated[ActivityLogQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    activity_log_service: ActivityLogService = Depends(get_activity_log_service),
):
    """Retrieve global activity logs."""
    try:
        return await activity_log_service.get_all_activity_logs(
            tenant_id=None,
            query=query,
            pagination=pagination,
            is_global_only=True
        )
    except Exception as exc:
        logger.error("get_global_activity_logs_failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve global activity logs"
        )

@router.get(
    "/{log_id}", 
    response_model=ActivityLogResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.ACTIVITY_LOGS, PermissionAction.READ,
        require_global_admin=True
    ))]
)
async def get_global_activity_log(
    log_id: str,
    activity_log_service: ActivityLogService = Depends(get_activity_log_service),
):
    """Retrieve details of a specific global activity log."""
    try:
        return await activity_log_service.get_activity_log_by_id(
            tenant_id=None,
            activity_log_id=log_id
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "get_global_activity_log_failed",
            log_id=log_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve global activity log detail"
        )
