import math
from datetime import datetime, timezone
from fastapi import BackgroundTasks
from app.repositories import UserSessionRepository
from app.schemas import (
    UserSessionResponse, UserSessionPaginatedResponse,
    PaginationQuery, PaginationResponse
)
from app.services.activity_log_service import ActivityLogService
from app.services.exceptions import NotFoundError
from app.services.geoip_service import geoip_service
from app.utils.session import parse_device_info, calculate_status

class UserSessionService:
    def __init__(self, session_repo: UserSessionRepository):
        self.session_repo = session_repo
        
    async def get_user_sessions(
        self, user_id: str, tenant_id: str | None, 
        current_jti: str | None, pagination: PaginationQuery
    ) -> UserSessionPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit
        
        sessions, total_records = await self.session_repo.get_user_sessions(
            user_id=user_id, 
            tenant_id=tenant_id, 
            skip=skip, 
            limit=pagination.limit
        )
        
        # Calculate total pages
        total_pages = (
            math.ceil(total_records / pagination.limit) 
            if total_records > 0 else 0
        )
        
        # Convert UserSession models to Pydantic UserSessionResponse
        session_responses = []
        for session in sessions:
            is_current = session.jti == current_jti
            location = geoip_service.get_location(session.ip_address)
            device = parse_device_info(session.user_agent)
            status = calculate_status(session.created_at, is_current)
            is_revoked = (
                session.revoked_at is not None 
                or session.expires_at < datetime.now(timezone.utc)
            )
            session_resp = UserSessionResponse(
                id=session.id,
                user_id=session.user_id,
                tenant_id=session.tenant_id,
                ip_address=session.ip_address,
                user_agent=session.user_agent,
                device=device,
                location=location,
                status=status,
                is_current=is_current,
                is_revoked=is_revoked
            )
            session_responses.append(session_resp)
        
        return UserSessionPaginatedResponse(
            sessions=session_responses,
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )

    async def revoke_session(
        self,
        session_id: str,
        user_id: str,
        tenant_id: str | None,
        jti: str,
        client_ip: str | None,
        background_tasks: BackgroundTasks
    ):
        # Check if session belongs to user
        session = await self.session_repo.get_user_session(
            session_id, tenant_id=tenant_id, user_id=user_id
        )

        if (not session 
            or session.revoked_at is not None 
            or session.expires_at < datetime.now(timezone.utc)
        ):
            ActivityLogService.log(
                background_tasks=background_tasks,
                user_id=user_id,
                tenant_id=tenant_id,
                action="session.revoke.fail",
                resource="session",
                meta_data={"session_id": session_id},
                ip_address=client_ip
            )
            raise NotFoundError()
        
        session.revoked_at = datetime.now(timezone.utc)
        
        await self.session_repo.save(session)

        ActivityLogService.log(
            background_tasks=background_tasks,
            user_id=user_id,
            tenant_id=tenant_id,
            action="session.revoke.success",
            resource="session",
            meta_data={"session_id": session_id},
            ip_address=client_ip
        )

        return {
            "is_current_session": session.jti == jti
        }
        
