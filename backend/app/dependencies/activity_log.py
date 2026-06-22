from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.repositories import ActivityLogRepository
from app.services.activity_log_service import ActivityLogService

async def get_activity_log_service(
    db: AsyncSession = Depends(get_db)
) -> ActivityLogService:
    repo = ActivityLogRepository(db)
    return ActivityLogService(repo)
