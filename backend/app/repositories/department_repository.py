from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Department

class DepartmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_departments(self):
        stmt = select(Department).where(Department.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_all_simple_departments(self):
        stmt = select(Department.id, Department.name, Department.code).where(Department.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.all()

    async def get_department_by_id(self, department_id: int):
        stmt = select(Department).where(Department.id == department_id, Department.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_department_by_code(self, code: str):
        stmt = select(Department).where(Department.code == code, Department.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_department(self, department: Department):
        try:
            self.db.add(department)
            await self.db.commit()
            return await self.get_department_by_id(department.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, department: Department):
        try:
            await self.db.commit()
            await self.db.refresh(department)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def delete_department(self, department: Department):
        try:
            department.is_deleted = True
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
