from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import JobTitleRepository
from app.services import JobTitleService


def get_job_title_service(
        db: AsyncSession = Depends(get_db)
) -> JobTitleService:
    repo = JobTitleRepository(db)
    return JobTitleService(repo)