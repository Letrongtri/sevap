from fastapi import APIRouter, HTTPException, Depends, Request

from app.services import (
    DirectoryService,
    NotFoundError,
)
from app.schemas import DirectoryOverviewResponse
from app.dependencies import get_directory_service, check_permission
from app.core.enum import PermissionResource, PermissionAction
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/overview", 
    response_model=DirectoryOverviewResponse, 
    dependencies=[Depends(check_permission(
        PermissionResource.USERS, PermissionAction.READ
    ))]
)
async def get_directory_overview(
    request: Request,
    directory_service: DirectoryService = Depends(get_directory_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await directory_service.get_directory_overview(tenant_id)
    except Exception as exc:
        logger.error(
            "get_directory_overview_failed",
            tenant_id=tenant_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get directory overview")
