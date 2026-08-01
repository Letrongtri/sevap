from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from app.dependencies import get_tenant_service, get_current_user
from app.schemas import TenantCreate, TenantUpdate, TenantResponse
from app.services import TenantService, TenantAlreadyExistsError, NotFoundError
from app.decorators import log_activity
from app.core.logging import logger
from app.core.enum import PermissionAction, PermissionResource
from app.dependencies import check_permission

router = APIRouter()

@router.post("/register", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
@log_activity(
    action="tenant.register",
    resource="tenant",
    meta_extractor=lambda res, *args, **kwargs: {
        "tenant_name": res.company_name,
        "tenant_domain": res.tenant_domain
    },
    is_global=True
)
async def register_tenant(
    request: Request,
    data: TenantCreate,
    background_tasks: BackgroundTasks,
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.register_tenant(data)
    except TenantAlreadyExistsError as e:
        logger.error("tenant_registration_failed_exists", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("tenant_registration_failed_internal", error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Failed to register tenant")

@router.put(
    "", 
    response_model=TenantResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.TENANTS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="tenant.update",
    resource="tenant",
    meta_extractor=lambda res, *args, **kwargs: {"tenant_name": res.company_name}
)
async def update_tenant(
    request: Request,
    data: TenantUpdate,
    background_tasks: BackgroundTasks,
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(get_current_user)
):
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_service.update_tenant(tenant_id, data)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_update", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except TenantAlreadyExistsError as e:
        logger.error("tenant_update_conflict", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("tenant_update_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Failed to update tenant")

@router.delete(
    "", 
    response_model=TenantResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.TENANTS, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="tenant.delete",
    resource="tenant",
    meta_extractor=lambda res, *args, **kwargs: {"tenant_name": res.company_name}
)
async def soft_delete_tenant(
    request: Request,
    background_tasks: BackgroundTasks,
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(get_current_user)
):
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_service.soft_delete_tenant(tenant_id)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_delete", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error("tenant_delete_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Failed to delete tenant")

@router.get("/info", response_model=TenantResponse)
async def get_tenant_info(
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(get_current_user)
):
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_service.get_tenant_by_id(tenant_id)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_info", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error("tenant_info_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Failed to get tenant info")
