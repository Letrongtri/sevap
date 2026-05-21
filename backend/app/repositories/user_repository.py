from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_employee_code(self, employee_code: str):
        stmt = select(User).where(User.employee_code == employee_code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: int):
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_user(self, user: User):
        try:
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            return user
        except Exception as e:
            await self.db.rollback()
            raise e
