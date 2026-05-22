from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories.role_repository import RoleRepository
from app.repositories.permission_repository import PermissionRepository
from app.services.role_service import RoleService


def get_role_service(
        db: AsyncSession = Depends(get_db)
) -> RoleService:
    repo = RoleRepository(db)
    permissions_repo = PermissionRepository(db)
    return RoleService(repo, permissions_repo)