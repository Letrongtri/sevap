from fastapi import APIRouter, HTTPException, Depends, Request

from app.services import DirectoryService
from app.services.exceptions import AccessDeniedError
from app.schemas import DirectoryOverviewResponse
from app.dependencies import get_directory_service, get_current_user
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/overview", 
    response_model=DirectoryOverviewResponse, 
    dependencies=[Depends(get_current_user)]
)
async def get_directory_overview(
    request: Request,
    directory_service: DirectoryService = Depends(get_directory_service),
):
    try:
        tenant_id = request.state.tenant_id
        user_id = request.state.user["id"]
        permissions = request.state.user.get("permissions", [])
        return await directory_service.get_directory_overview(
            tenant_id=tenant_id,
            user_id=user_id,
            permissions=permissions
        )
    except AccessDeniedError:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
    except Exception as exc:
        logger.error(
            "get_directory_overview_failed",
            tenant_id=request.state.tenant_id if hasattr(request.state, "tenant_id") else None,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get directory overview")
