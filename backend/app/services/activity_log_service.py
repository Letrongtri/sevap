import asyncio
import math
from fastapi import BackgroundTasks
from app.schemas import (
    ActivityLogResponse, ActivityLogPaginatedResponse,
    PaginationQuery, ActivityLogQuery, PaginationResponse,
    ActivityLogDetailResponse
)
from app.services.exceptions import NotFoundError
from app.services.geoip_service import geoip_service
from app.services.socket_manager import log_socket_manager
from app.repositories import ActivityLogRepository
from app.db.session import AsyncSessionLocal
from app.models import ActivityLog
from app.core.logging import logger
from app.utils.device import parse_device_info

class ActivityLogService:
    def __init__(self, activity_log_repo: ActivityLogRepository):
        self.repo = activity_log_repo
        
    @staticmethod
    async def _write_log_bg(
        user_id: str | None,
        tenant_id: str | None,
        action: str,
        resource: str | None,
        meta_data: dict | None,
        ip_address: str | None,
        user_agent: str | None,
        log_level: str
    ):
        try:
            async with AsyncSessionLocal() as db:
                repo = ActivityLogRepository(db)
                activity_log = ActivityLog(
                    user_id=user_id,
                    tenant_id=tenant_id,
                    action=action,
                    resource=resource,
                    meta_data=meta_data,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    log_level=log_level
                )
                await repo.create_activity_log(activity_log)
                new_log = await repo.get_activity_log_by_id(activity_log.id, tenant_id)
                log_response = ActivityLogResponse.model_validate(new_log)

            asyncio.create_task(
                log_socket_manager.broadcast_new_log(
                    tenant_id=tenant_id,
                    new_log=log_response
                )
            )
        except Exception:
            logger.error(
                "failed_to_write_activity_log_bg",
                action=action,
                tenant_id=tenant_id,
                user_id=user_id,
                exc_info=True
            )

    @classmethod
    def log(
        cls,
        background_tasks: BackgroundTasks | None,
        user_id: str | None,
        tenant_id: str | None,
        action: str,
        resource: str | None = None,
        meta_data: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        log_level: str = "INFO"
    ):
        if background_tasks is not None:
            background_tasks.add_task(
                cls._write_log_bg,
                user_id=user_id,
                tenant_id=tenant_id,
                action=action,
                resource=resource,
                meta_data=meta_data,
                ip_address=ip_address,
                user_agent=user_agent,
                log_level=log_level
            )
        else:
            import asyncio
            asyncio.create_task(
                cls._write_log_bg(
                    user_id=user_id,
                    tenant_id=tenant_id,
                    action=action,
                    resource=resource,
                    meta_data=meta_data,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    log_level=log_level
                )
            )
    
    async def get_activity_log_by_id(
        self, activity_log_id: str, tenant_id: str | None,
        is_global_only: bool = False
    ) -> ActivityLogDetailResponse:
        log = await self.repo.get_activity_log_by_id(activity_log_id, tenant_id)
        if not log:
            raise NotFoundError()

        if is_global_only and log.tenant_id is not None:
            raise NotFoundError()
        
        log.location = geoip_service.get_location(log.ip_address) if log.ip_address else None
        log.device = parse_device_info(log.user_agent) if log.user_agent else None

        return ActivityLogDetailResponse.model_validate(log)
    
    async def get_all_activity_logs(
        self, tenant_id: str | None, query: ActivityLogQuery, 
        pagination: PaginationQuery,
        is_global_only: bool = False
    ) -> ActivityLogPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit
 
        logs, total = await self.repo.get_all_activity_logs(
            action=query.action, 
            resource=query.resource,
            user_id=query.user_id, 
            tenant_id=tenant_id,
            log_level=query.log_level,
            start_date=query.start_date,
            end_date=query.end_date,
            limit=pagination.limit,
            offset=skip,
            sort_by=query.sort_by,
            sort_order=query.sort_order,
            is_global_only=is_global_only
        )
 
        total_pages = (
            math.ceil(total / pagination.limit)
            if total > 0 else 0
        )
 
        return ActivityLogPaginatedResponse(
            data=[
                ActivityLogResponse.model_validate(log) 
                for log in logs
            ],
            pagination=PaginationResponse(
                page=pagination.page,
                limit=pagination.limit,
                total=total,
                total_pages=total_pages
            )
        )
