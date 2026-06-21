from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import GlobalAdminRepository
from app.services import GlobalAdminService


def get_global_admin_service(
        db: AsyncSession = Depends(get_db)
) -> GlobalAdminService:
    repo = GlobalAdminRepository(db)
    return GlobalAdminService(repo)