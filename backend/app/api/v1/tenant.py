from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.dependencies import get_tenant_service, get_current_user
from app.schemas import TenantCreate, TenantUpdate, TenantResponse
from app.services import TenantService, TenantAlreadyExistsError, NotFoundError
from app.core.logging import logger

router = APIRouter()

@router.post("/register", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def register_tenant(
    request: Request,
    data: TenantCreate,
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

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(get_current_user)
):
    try:
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

@router.delete("/{tenant_id}", response_model=TenantResponse)
async def soft_delete_tenant(
    tenant_id: str,
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(get_current_user)
):
    try:
        return await tenant_service.soft_delete_tenant(tenant_id)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_delete", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error("tenant_delete_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Failed to delete tenant")
