from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models import UserSession

class UserSessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user_session(self, user_session: UserSession):
        try:
            self.db.add(user_session)
            await self.db.commit()
            await self.db.refresh(user_session)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, user_session: UserSession):
        try:
            await self.db.commit()
            # NOTE: No refresh() — see user_repository.py save() for explanation.
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_user_session_by_jti(self, jti: str):
        stmt = select(UserSession).where(UserSession.jti == jti)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    async def get_user_sessions(
        self, user_id: str, skip: int, limit: int,
        tenant_id: str | None = None
    ) -> tuple[list[UserSession], int]:
        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.tenant_id == tenant_id
        )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt) or 0

        stmt = (
            stmt.order_by(UserSession.id.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return result.scalars().all(), total_records
