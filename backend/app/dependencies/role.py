from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies import get_db
from app.repositories import RoleRepository, PermissionRepository
from app.services import RoleService


def get_role_service(
        db: AsyncSession = Depends(get_db)
) -> RoleService:
    repo = RoleRepository(db)
    permissions_repo = PermissionRepository(db)
    return RoleService(repo, permissions_repo)