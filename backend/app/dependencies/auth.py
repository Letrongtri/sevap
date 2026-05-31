from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.repositories.user_session_repository import UserSessionRepository


def get_auth_service(
        db: AsyncSession = Depends(get_db)
) -> AuthService:
    user_repo = UserRepository(db)
    session_repo = UserSessionRepository(db)
    return AuthService(user_repo, session_repo)