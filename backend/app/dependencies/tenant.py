from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import TenantRepository, PermissionRepository
from app.services import TenantService


def get_tenant_service(
        db: AsyncSession = Depends(get_db)
) -> TenantService:
    tenant_repo = TenantRepository(db)
    permission_repo = PermissionRepository(db)
    return TenantService(tenant_repo, permission_repo)
