from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import PermissionRepository
from app.services import PermissionService


def get_permission_service(
        db: AsyncSession = Depends(get_db)
) -> PermissionService:
    repo = PermissionRepository(db)
    return PermissionService(repo)