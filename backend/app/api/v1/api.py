"""API v1 router configuration.

This module sets up the main API router and includes all sub-routers for different
endpoints like authentication and chatbot functionality.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.user import router as user_router
from app.api.v1.role import router as role_router
from app.api.v1.document import router as document_router
from app.api.v1.conversation import router as conversation_router
from app.core.logging import logger

api_router = APIRouter()

# Include routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(user_router, prefix="/users", tags=["users"])
api_router.include_router(role_router, prefix="/roles", tags=["roles"])
api_router.include_router(document_router, prefix="/documents", tags=["documents"])
api_router.include_router(conversation_router, prefix="/conversations", tags=["conversations"])

@api_router.get("/health")
async def health_check():
    """Health check endpoint.

    Returns:
        dict: Health status information.
    """
    logger.info("health_check_called")
    return {"status": "healthy", "version": "1.0.0"}