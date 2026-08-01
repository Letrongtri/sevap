from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models import User, Department, JobTitle

class DirectoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_directory_overview(
        self, 
        tenant_id: str,
        include_users: bool = True,
        include_departments: bool = True,
        include_job_titles: bool = True
    ):
        departments_count = 0
        job_titles_count = 0
        users_count = 0

        if include_departments:
            department_stmt = select(Department).where(
                Department.tenant_id == tenant_id,
                Department.is_deleted == False
            )
            department_count_stmt = select(func.count()).select_from(department_stmt.subquery())
            res = await self.db.execute(department_count_stmt)
            departments_count = res.scalar_one()

        if include_job_titles:
            job_title_stmt = select(JobTitle).where(
                JobTitle.tenant_id == tenant_id,
                JobTitle.is_deleted == False
            )
            job_title_count_stmt = select(func.count()).select_from(job_title_stmt.subquery())
            res = await self.db.execute(job_title_count_stmt)
            job_titles_count = res.scalar_one()

        if include_users:
            user_stmt = select(User).where(
                User.tenant_id == tenant_id,
                User.is_deleted == False
            )
            user_count_stmt = select(func.count()).select_from(user_stmt.subquery())
            res = await self.db.execute(user_count_stmt)
            users_count = res.scalar_one()

        return {
            "departments_count": departments_count,
            "job_titles_count": job_titles_count,
            "users_count": users_count
        }