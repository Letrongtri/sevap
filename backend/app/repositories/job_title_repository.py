from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func

from app.models import JobTitle

class JobTitleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_job_titles(
        self, tenant_id: str, query: str | None = None,
        skip: int = 0, limit: int = 10
    ) -> tuple[list[JobTitle], int]:
        stmt = select(JobTitle).where(
            JobTitle.is_deleted == False, 
            JobTitle.tenant_id == tenant_id
        )
        if query is not None:
            stmt = stmt.filter(
                or_(
                    JobTitle.title_name.ilike(f"%{query}%"),
                    JobTitle.code.ilike(f"%{query}%"),
                )
            )
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        
        return items, total_records

    async def get_all_simple_job_titles(self, tenant_id: str):
        stmt = select(
            JobTitle.id, 
            JobTitle.title_name, 
            JobTitle.code
        ).where(
            JobTitle.is_deleted == False, 
            JobTitle.tenant_id == tenant_id
        )
        result = await self.db.execute(stmt)
        return result.mappings().all()

    async def get_job_title_by_id(self, job_title_id: str):
        stmt = select(JobTitle).where(
            JobTitle.id == job_title_id, 
            JobTitle.is_deleted == False
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_job_title_by_code(self, code: str, tenant_id: str):
        stmt = select(JobTitle).where(
            JobTitle.code == code, 
            JobTitle.is_deleted == False, 
            JobTitle.tenant_id == tenant_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_job_title(self, job_title: JobTitle):
        try:
            self.db.add(job_title)
            await self.db.commit()
            return await self.get_job_title_by_id(job_title.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, job_title: JobTitle):
        try:
            await self.db.commit()
            await self.db.refresh(job_title)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def delete_job_title(self, job_title: JobTitle):
        try:
            job_title.is_deleted = True
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e

    async def count_all_job_titles(self, tenant_id: str) -> int:
        result = await self.db.execute(
            select(func.count(JobTitle.id)).where(
                JobTitle.tenant_id == tenant_id,
                JobTitle.is_deleted == False
            )
        )
        return result.scalar_one()
