from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user_session import UserSession

class UserSessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user_session(self, user_session: UserSession):
        try:
            self.db.add(user_session)
            await self.db.commit()
            self.db.refresh(user_session)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, user_session: UserSession):
        try:
            await self.db.commit()
            await self.db.refresh(user_session)
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_user_session_by_jti(self, jti: str):
        stmt = select(UserSession).where(UserSession.jti == jti)
        result = await self.db.execute(stmt)
        return result.scalars().first()