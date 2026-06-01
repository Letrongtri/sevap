from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies import get_db
from app.repositories import UserRepository
from app.services import UserService


def get_user_service(
        db: AsyncSession = Depends(get_db)
) -> UserService:
    repo = UserRepository(db)
    return UserService(repo)