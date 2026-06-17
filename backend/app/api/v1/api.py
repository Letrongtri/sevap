"""API v1 router configuration.

This module sets up the main API router and includes all sub-routers for different
endpoints like authentication and chatbot functionality.
"""

from fastapi import APIRouter, Depends

from app.api.v1.auth import router as auth_router
from app.api.v1.user import router as user_router
from app.api.v1.role import router as role_router
from app.api.v1.document import router as document_router
from app.api.v1.conversation import router as conversation_router
from app.api.v1.department import router as department_router
from app.api.v1.job_title import router as job_title_router
from app.api.v1.permission import router as permission_router
from app.api.v1.tenant import router as tenant_router

from app.core.logging import logger
from app.dependencies import get_current_user

api_router = APIRouter()

# Include routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(tenant_router, prefix="/tenants", tags=["tenants"])
api_router.include_router(user_router, prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])
api_router.include_router(role_router, prefix="/roles", tags=["roles"], dependencies=[Depends(get_current_user)])
api_router.include_router(document_router, prefix="/documents", tags=["documents"], dependencies=[Depends(get_current_user)])
api_router.include_router(conversation_router, prefix="/conversations", tags=["conversations"], dependencies=[Depends(get_current_user)])
api_router.include_router(department_router, prefix="/departments", tags=["departments"], dependencies=[Depends(get_current_user)])
api_router.include_router(job_title_router, prefix="/job_titles", tags=["job_titles"], dependencies=[Depends(get_current_user)])
api_router.include_router(permission_router, prefix="/permissions", tags=["permissions"], dependencies=[Depends(get_current_user)])

@api_router.get("/health")
async def health_check():
    """Health check endpoint.

    Returns:
        dict: Health status information.
    """
    logger.info("health_check_called")
    return {"status": "healthy", "version": "1.0.0"}