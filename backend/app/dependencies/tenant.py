from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import TenantRepository
from app.services import TenantService


def get_tenant_service(
        db: AsyncSession = Depends(get_db)
) -> TenantService:
    repo = TenantRepository(db)
    return TenantService(repo, db)
