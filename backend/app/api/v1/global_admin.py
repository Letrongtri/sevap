from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.dependencies import get_tenant_service, get_global_admin_service
from app.schemas import (
    TenantCreate, TenantUpdate, TenantResponse, 
    TenantPaginatedResponse, TenantQuery, PaginationQuery,
    TenantSummaryResponse, VectorStorageResponse,
    LLMMetricsResponse
)
from app.services import (
    TenantService, GlobalAdminService,
    TenantAlreadyExistsError, NotFoundError
)
from app.core.logging import logger

router = APIRouter()

@router.get("/tenants", response_model=TenantPaginatedResponse)
async def get_tenants(
    request: Request,
    query: Annotated[TenantQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.get_tenants(query, pagination)
    except Exception as e:
        logger.error("tenant_get_by_admin_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, 
            detail="Failed to get tenants by admin"
        )

@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    request: Request,
    data: TenantCreate,
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.register_tenant(data)
    except TenantAlreadyExistsError as e:
        logger.error("tenant_registration_failed_exists", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "tenant_registration_failed_internal",
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to register tenant by admin"
        )

@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant_by_id(
    request: Request,
    tenant_id: str,
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.get_tenant_by_id(tenant_id)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_info", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            "tenant_info_failed",
            tenant_id=tenant_id,
            error=str(e), 
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, 
            detail="Failed to get tenant info by admin"
        )

@router.put("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    request: Request,
    tenant_id: str,
    data: TenantUpdate,
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.update_tenant(tenant_id, data)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_admin_update", tenant_id=tenant_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            "tenant_admin_update_failed",
            tenant_id=tenant_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to update tenant by admin"
        )

@router.delete("/tenants/{tenant_id}", response_model=TenantResponse)
async def delete_tenant(
    tenant_id: str,
    tenant_service: TenantService = Depends(get_tenant_service),
):
    try:
        return await tenant_service.soft_delete_tenant(tenant_id)
    except NotFoundError as e:
        logger.error("tenant_not_found_on_delete", tenant_id=tenant_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "tenant_delete_failed",
            tenant_id=tenant_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to delete tenant"
        )

@router.get("/dashboard/tenants/summary", response_model=TenantSummaryResponse)
async def get_tenant_summary(
    global_admin_service: GlobalAdminService = Depends(get_global_admin_service),
):
    """
    Get summary statistics for all tenants
    Only accessible by global admin
    """
    try:
        return await global_admin_service.get_tenant_summary()
    except Exception as e:
        logger.error("tenant_summary_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to get tenant summary"
        )

@router.get("/dashboard/resources/vector-storage", response_model=VectorStorageResponse)
async def get_vector_storage_info(
    global_admin_service: GlobalAdminService = Depends(get_global_admin_service),
):
    try:
        return await global_admin_service.get_vector_storage_info()
    except Exception as e:
        logger.error("vector_storage_info_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to get vector storage info"
        )

@router.get("/dashboard/resources/llm-metrics", response_model=LLMMetricsResponse)
async def get_llm_metrics(
    global_admin_service: GlobalAdminService = Depends(get_global_admin_service),
):
    """
    Thu thập thông tin hiệu năng thời gian thực từ cụm mô hình ngôn ngữ lớn (Ollama cục bộ).
    """
    try:
        return await global_admin_service.get_llm_metrics()
    except Exception as e:
        logger.error("llm_metrics_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to get LLM metrics"
        )