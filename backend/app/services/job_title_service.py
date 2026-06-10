from typing import List

from app.models import JobTitle
from app.repositories import JobTitleRepository
from app.services.exceptions import (
    JobTitleAlreadyExistsError, 
    NotFoundError,
)
from app.schemas import JobTitleSimple

class JobTitleService:
    def __init__(self, repo: JobTitleRepository):
        self.repo = repo
    
    async def get_all_job_titles(self) -> List[JobTitle]:
        return await self.repo.get_all_job_titles()

    async def get_all_simple_job_titles(self) -> List[JobTitleSimple]:
        job_titles = await self.repo.get_all_simple_job_titles()
        return [
            JobTitleSimple(
                id=job_title.id, 
                title_name=job_title.title_name,
                code=job_title.code,
            ) for job_title in job_titles
        ]

    async def create_job_title(self, title_name: str, code: str, 
                                description: str | None = None) -> JobTitle:
        existing = await self.repo.get_job_title_by_code(code)
        if existing is not None:
            raise JobTitleAlreadyExistsError()
                
        job_title = JobTitle(
            title_name=title_name,
            code=code,
            description=description
        )

        return await self.repo.create_job_title(job_title)
    
    async def get_job_title_by_id(self, job_title_id: int) -> JobTitle | None:
        job_title = await self.repo.get_job_title_by_id(job_title_id)
        if job_title is None:
            raise NotFoundError()
        return JobTitle

    async def update_job_title(self, job_title_id: int, title_name: str | None = None, 
                          description: str | None = None) -> JobTitle:
        existing = await self.repo.get_job_title_by_id(job_title_id)
        if existing is None:
            raise NotFoundError()
        
        if title_name is not None:
            existing.title_name = title_name
        if description is not None:
            existing.description = description

        await self.repo.save(job_title=existing)
        return existing
    
    async def delete_job_title(self, job_title_id: int) -> JobTitle:
        existing = await self.repo.get_job_title_by_id(job_title_id)
        if existing is None:
            raise NotFoundError()
        
        await self.repo.delete_job_title(existing)
        return existing
