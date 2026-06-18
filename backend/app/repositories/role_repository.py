from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.models import Role

class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_roles(
        self,
        query: str | None = None,
        is_system: bool | None = None,
        skip: int = 0,
        limit: int = 20
    ):
        stmt = select(Role).where(Role.is_deleted == False)

        if query is not None:
            stmt = stmt.where(Role.name.ilike(f"%{query}%"))

        if is_system is not None:
            stmt = stmt.where(Role.is_system == is_system)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)

        stmt = (
            stmt
            .options(selectinload(Role.permissions))
            .order_by(Role.id.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        roles = result.unique().scalars().all()

        return list(roles), total_records

    async def get_all_simple_roles(self):
        stmt = select(Role.id, Role.name).where(Role.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.all()

    async def get_role_by_id(self, role_id: int):
        stmt = select(Role).where(Role.id == role_id, Role.is_deleted == False).options(selectinload(Role.permissions))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_role_by_name(self, name: str):
        stmt = select(Role).where(Role.name == name, Role.is_deleted == False)
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
            role.is_deleted = True
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
