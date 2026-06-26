from fastapi import (
    APIRouter, Request, Depends, BackgroundTasks, HTTPException
)
from app.services import UserSessionService, NotFoundError
from app.dependencies import get_user_session_service
from app.core.logging import logger

router = APIRouter()

@router.post("/{session_id}/revoke")
async def revoke_session(
    request: Request,
    session_id: str,
    background_tasks: BackgroundTasks,
    user_session_service: UserSessionService = Depends(
        get_user_session_service
    )
):
    try:
        user_id = request.state.user["user_id"]
        tenant_id = request.state.user.get("tenant_id")
        jti = request.state.jti
        client_ip = request.client.host if request.client else None
        
        return await user_session_service.revoke_session(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            jti=jti,
            client_ip=client_ip,
            background_tasks=background_tasks
        )
    except NotFoundError:
        logger.error("session_not_found", exc_info=True)
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        logger.error("revoke_session_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
