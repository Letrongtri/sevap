from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import Role

class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_roles(self):
        stmt = select(Role).options(selectinload(Role.permissions))
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_role_by_id(self, role_id: int):
        stmt = select(Role).where(Role.id == role_id).options(selectinload(Role.permissions))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_role_by_name(self, name: str):
        stmt = select(Role).where(Role.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_role(self, role: Role):
        try:
            self.db.add(role)
            await self.db.commit()
            return await self.get_role_by_id(role.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, role: Role):
        try:
            await self.db.commit()
            return await self.get_role_by_id(role.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def delete_role(self, role: Role):
        try:
            await self.db.delete(role)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
