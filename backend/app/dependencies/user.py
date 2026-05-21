from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService


def get_user_service(
        db: AsyncSession = Depends(get_db)
) -> UserService:
    repo = UserRepository(db)
    return UserService(repo)