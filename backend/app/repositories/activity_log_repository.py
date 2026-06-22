from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.enum import LogLevel
from app.models import ActivityLog

class ActivityLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_activity_log(self, activity_log: ActivityLog):
        try:
            self.db.add(activity_log)
            await self.db.commit()
            await self.db.refresh(activity_log)
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_activity_log_by_id(self, activity_log_id: str):
        stmt = select(ActivityLog).where(
            ActivityLog.id == activity_log_id, 
            ActivityLog.is_deleted == False
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_activity_logs(
        self, 
        action: str | None = None,
        resource: str | None = None,
        user_id: str | None = None,
        tenant_id: str | None = None,
        log_level: LogLevel | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 10,
        offset: int = 0,
        is_global_only: bool = False
    ):
        stmt = select(ActivityLog).where(
            ActivityLog.is_deleted == False
        )

        if action:
            stmt = stmt.where(ActivityLog.action == action)
        if resource:
            stmt = stmt.where(ActivityLog.resource == resource)
        if user_id:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if is_global_only:
            stmt = stmt.where(ActivityLog.tenant_id.is_(None))
        elif tenant_id:
            stmt = stmt.where(ActivityLog.tenant_id == tenant_id)
        if log_level:
            stmt = stmt.where(ActivityLog.log_level == log_level)
        if start_date:
            stmt = stmt.where(ActivityLog.created_at >= start_date)
        if end_date:
            stmt = stmt.where(ActivityLog.created_at <= end_date)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)

        stmt = (
            stmt
            .order_by(ActivityLog.id.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        activity_logs = result.unique().scalars().all()
        return list(activity_logs), total_records