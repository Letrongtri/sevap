from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, Request, status

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
        PermissionResource.ACTIVITY_LOGS, PermissionAction.READ
    ))]
)
async def get_tenant_activity_logs(
    request: Request,
    query: Annotated[ActivityLogQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    activity_log_service: ActivityLogService = Depends(get_activity_log_service)
):
    """Retrieve activity logs. Only accessible to administrators."""
    try:
        tenant_id = request.state.tenant_id
        target_tenant_id = tenant_id
        current_user = request.state.user
        
        if current_user.get("is_global_admin") and query.tenant_id:
            target_tenant_id = query.tenant_id

        res = await activity_log_service.get_all_activity_logs(
            tenant_id=target_tenant_id,
            query=query,
            pagination=pagination
        )
        
        # Redact conversation/document log metadata for global admins viewing tenant logs
        if current_user.get("is_global_admin"):
            for item in res.data:
                if item.tenant_id is not None and item.resource in ["conversation", "document"]:
                    item.meta_data = {"warning": "Content redacted for privacy protection"}
                    
        return res
    except Exception as exc:
        logger.error(
            "get_activity_logs_failed",
            tenant_id=request.state.tenant_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity logs"
        )

@router.get(
    "/{log_id}", 
    response_model=ActivityLogResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.ACTIVITY_LOGS, PermissionAction.READ
    ))]
)
async def get_activity_log(
    request: Request,
    log_id: str,
    activity_log_service: ActivityLogService = Depends(get_activity_log_service)
):
    """Retrieve details of a specific activity log."""
    try:
        tenant_id = request.state.tenant_id
        current_user = request.state.user
        if current_user.get("is_global_admin"):
            log = await activity_log_service.repo.get_activity_log_by_id(log_id)
            if not log:
                raise HTTPException(status_code=404, detail="Activity log not found")
            # Restrict access to conversation and document resource details for global admin
            if log.tenant_id is not None and log.resource in ["conversation", "document"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Global Admins are restricted from viewing detailed tenant conversation or document logs."
                )
            return ActivityLogResponse.model_validate(log)
            
        return await activity_log_service.get_activity_log_by_id(tenant_id, log_id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "get_activity_log_by_id_failed",
            log_id=log_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity log detail"
        )
