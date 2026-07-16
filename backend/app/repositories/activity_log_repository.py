from sqlalchemy.engine import row
from app.core.enum import SortOrder
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.enum import LogLevel
from app.models import ActivityLog, User

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
    
    async def get_activity_log_by_id(self, activity_log_id: str, tenant_id: str | None):
        stmt = select(ActivityLog, User.full_name, User.employee_code, User.email).where(
            ActivityLog.id == activity_log_id, 
            ActivityLog.is_deleted == False,
            ActivityLog.tenant_id == tenant_id
        ).outerjoin(User, ActivityLog.user_id == User.id)

        result = await self.db.execute(stmt)
        row = result.one_or_none() 
    
        if row is None:
            return None

        log, full_name, employee_code, email = row
        log.user_name = full_name or "System"
        log.employee_code = employee_code
        log.email = email

        return log

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
        sort_by: str | None = None,
        sort_order: str | None = None,
        is_global_only: bool = False
    ):
        stmt = select(ActivityLog, User.full_name, User.employee_code).where(
            ActivityLog.is_deleted == False
        ).outerjoin(User, ActivityLog.user_id == User.id)

        if not is_global_only and tenant_id:
            stmt = stmt.filter(ActivityLog.tenant_id == tenant_id)
        elif not is_global_only:
            stmt = stmt.filter(ActivityLog.tenant_id.is_(None))

        if action:
            stmt = stmt.filter(ActivityLog.action.like(f"%{action}%"))
        if resource:
            stmt = stmt.filter(ActivityLog.resource.like(f"%{resource}%"))
        if user_id:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if log_level:
            stmt = stmt.where(ActivityLog.log_level == log_level)
        if start_date:
            stmt = stmt.where(ActivityLog.created_at >= start_date)
        if end_date:
            stmt = stmt.where(ActivityLog.created_at <= end_date)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)


        if sort_by:
            if sort_by == "user_name":
                sort_column = User.full_name
            elif sort_by == "employee_code":
                sort_column = User.employee_code
            else:
                sort_column = getattr(ActivityLog, sort_by, ActivityLog.id)

            if sort_order == SortOrder.ASC:
                stmt = stmt.order_by(sort_column.asc())
            else:
                stmt = stmt.order_by(sort_column.desc())
        else:
            if sort_order == SortOrder.ASC:
                stmt = stmt.order_by(ActivityLog.id.asc())
            else:
                stmt = stmt.order_by(ActivityLog.id.desc())

        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)

        logs_with_users = []
        for log, full_name, employee_code in result.all():
            log.user_name = full_name or "System"
            log.employee_code = employee_code or None
            logs_with_users.append(log)
        return logs_with_users, total_records
