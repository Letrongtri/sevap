from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import JobTitle

class JobTitleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_job_titles(self):
        stmt = select(JobTitle)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_all_simple_job_titles(self):
        stmt = select(JobTitle.id, JobTitle.title_name, JobTitle.code)
        result = await self.db.execute(stmt)
        return result.all()

    async def get_job_title_by_id(self, job_title_id: int):
        stmt = select(JobTitle).where(JobTitle.id == job_title_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_job_title_by_code(self, code: str):
        stmt = select(JobTitle).where(JobTitle.code == code)
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
            await self.db.delete(job_title)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
