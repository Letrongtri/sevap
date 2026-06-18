from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import UserRepository, UserSessionRepository, TenantRepository
from app.services import AuthService


def get_auth_service(
        db: AsyncSession = Depends(get_db)
) -> AuthService:
    user_repo = UserRepository(db)
    session_repo = UserSessionRepository(db)
    tenant_repo = TenantRepository(db)
    return AuthService(user_repo, session_repo, tenant_repo)