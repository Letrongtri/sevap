from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func

from app.models import Department

class DepartmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_departments(
        self, tenant_id: str, query: str | None = None, 
        skip: int = 0, limit: int = 10
    ) -> tuple[list[Department], int]:
        stmt = select(Department).where(
            Department.tenant_id == tenant_id,
            Department.is_deleted == False
        )

        if query is not None:
            stmt = stmt.filter(
                or_(
                    Department.name.ilike(f"%{query}%"),
                    Department.code.ilike(f"%{query}%"),
                )
            )
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        
        return items, total_records

    async def get_all_simple_departments(self, tenant_id: str):
        stmt = select(Department.id, Department.name, Department.code).where(
            Department.tenant_id == tenant_id,
            Department.is_deleted == False
        )
        result = await self.db.execute(stmt)
        return result.mappings().all()

    async def get_department_by_id(self, department_id: str):
        stmt = select(Department).where(
            Department.id == department_id,
            Department.is_deleted == False
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_department_by_code(self, code: str, tenant_id: str):
        stmt = select(Department).where(
            Department.code == code,
            Department.tenant_id == tenant_id,
            Department.is_deleted == False
        )
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

    async def count_all_departments(self, tenant_id: str) -> int:
        result = await self.db.execute(
            select(func.count(Department.id)).where(
                Department.tenant_id == tenant_id,
                Department.is_deleted == False
            )
        )
        return result.scalar_one()
