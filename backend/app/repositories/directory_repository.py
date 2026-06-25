from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models import User, Department, JobTitle

class DirectoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_directory_overview(self, tenant_id: str):
        department_stmt = select(Department).where(
            Department.tenant_id == tenant_id,
            Department.is_deleted == False
        )
        department_count = select(func.count()).select_from(department_stmt.subquery())
        
        job_title_stmt = select(JobTitle).where(
            JobTitle.tenant_id == tenant_id,
            JobTitle.is_deleted == False
        )
        job_title_count = select(func.count()).select_from(job_title_stmt.subquery())

        user_stmt = select(User).where(
            User.tenant_id == tenant_id,
            User.is_deleted == False
        )
        user_count = select(func.count()).select_from(user_stmt.subquery())
        
        department_count_res = await self.db.execute(department_count)
        job_title_count_res = await self.db.execute(job_title_count)
        user_count_res = await self.db.execute(user_count)

        return {
            "departments_count": department_count_res.scalar_one(),
            "job_titles_count": job_title_count_res.scalar_one(),
            "users_count": user_count_res.scalar_one()
        }