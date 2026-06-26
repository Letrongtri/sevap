from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import UserSessionRepository
from app.services import UserSessionService


def get_user_session_service(
        db: AsyncSession = Depends(get_db)
) -> UserSessionService:
    repo = UserSessionRepository(db)
    return UserSessionService(repo)