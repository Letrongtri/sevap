from typing import Annotated
from fastapi import (
    APIRouter, Request, Depends, BackgroundTasks, HTTPException,
    status
)
from app.core.enum import DefaultRole
from app.services import UserSessionService, NotFoundError
from app.schemas import (
    UserSessionResponse, PaginationQuery, UserSessionAdminQuery,
    UserSessionAdminPaginatedResponse
)
from app.dependencies import get_user_session_service, check_role
from app.core.logging import logger
from app.utils.request import get_client_ip, get_user_agent

router = APIRouter()

@router.delete("/{session_id}/revoke")
async def revoke_session(
    request: Request,
    session_id: str,
    background_tasks: BackgroundTasks,
    user_session_service: UserSessionService = Depends(
        get_user_session_service
    )
):
    try:
        user_id = request.state.user["id"]
        tenant_id = request.state.user.get("tenant_id")
        jti = request.state.jti
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        return await user_session_service.revoke_session(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            jti=jti,
            client_ip=client_ip,
            user_agent=user_agent,
            background_tasks=background_tasks
        )
    except NotFoundError:
        logger.error("session_not_found", exc_info=True)
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        logger.error("revoke_session_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/admin", 
    response_model=UserSessionAdminPaginatedResponse,
    dependencies=[Depends(check_role(DefaultRole.ADMIN))]
)
async def get_tenant_user_sessions(
    request: Request,
    query: Annotated[UserSessionAdminQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    user_session_service: UserSessionService = Depends(get_user_session_service)
):
    try:
        tenant_id = request.state.tenant_id
        current_user_id = request.state.user["id"]

        return await user_session_service.get_tenant_user_sessions(
            tenant_id=tenant_id,
            current_user_id=current_user_id,
            query=query,
            pagination=pagination
        )
    except Exception as exc:
        logger.error(
            "get_tenant_user_sessions_failed",
            tenant_id=request.state.tenant_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user sessions"
        )
