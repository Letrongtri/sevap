from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.dependencies import (
    get_tenant_admin_service, get_current_user
)
from app.schemas import (
    AdminTenantOverviewResponse, AdminTenantChatStatisticsQuery,
    AdminTenantChatStatisticsItem,
    AdminTenantDocumentStatisticsResponse
)
from app.services import (
    TenantAdminService
)
from app.core.logging import logger
from app.core.enum import DefaultRole

router = APIRouter()

@router.get(
    "/dashboard/overview", 
    response_model=AdminTenantOverviewResponse
)
async def get_admin_tenant_overview(
    request: Request,
    current_user: dict = Depends(get_current_user),
    tenant_admin_service: TenantAdminService = Depends(get_tenant_admin_service),
):
    """
    Get summary statistics for a tenant
    Only accessible by tenant admin
    """
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_admin_service.get_admin_tenant_overview(tenant_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("get_admin_tenant_overview_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tenant summary"
        )

@router.get(
    "/dashboard/chats/statistics", 
    response_model=list[AdminTenantChatStatisticsItem]
)
async def get_admin_tenant_chat_statistics(
    request: Request,
    query: Annotated[AdminTenantChatStatisticsQuery, Depends()],
    current_user: dict = Depends(get_current_user),
    tenant_admin_service: TenantAdminService = Depends(get_tenant_admin_service),
):
    """
    Get chat statistics for a tenant
    Only accessible by tenant admin
    """
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_admin_service.get_admin_tenant_chat_statistics(tenant_id, query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("get_admin_tenant_chat_statistics_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tenant chat statistics"
        )

@router.get(
    "/dashboard/documents/statistics", 
    response_model=AdminTenantDocumentStatisticsResponse
)
async def get_admin_tenant_document_statistics(
    request: Request,
    current_user: dict = Depends(get_current_user),
    tenant_admin_service: TenantAdminService = Depends(get_tenant_admin_service),
):
    """
    Get document statistics for a tenant
    Only accessible by tenant admin
    """
    try:
        tenant_id = current_user.get("tenant_id")
        return await tenant_admin_service.get_admin_tenant_document_statistics(tenant_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("get_admin_tenant_document_statistics_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tenant document statistics"
        )
