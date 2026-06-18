from typing import List

from app.models import JobTitle
from app.repositories import JobTitleRepository
from app.services.exceptions import (
    JobTitleAlreadyExistsError, 
    NotFoundError,
)
from app.schemas import (
    JobTitleSimple, 
    JobTitleCreate, 
    JobTitleResponse, 
    JobTitleUpdate
)

class JobTitleService:
    def __init__(self, repo: JobTitleRepository):
        self.repo = repo
    
    async def get_all_job_titles(self, tenant_id: str) -> List[JobTitleResponse]:
        jobs = await self.repo.get_all_job_titles(tenant_id)
        return [
            JobTitleResponse.model_validate(job_title) 
            for job_title in jobs
        ]

    async def get_all_simple_job_titles(self, tenant_id: str) -> List[JobTitleSimple]:
        job_titles = await self.repo.get_all_simple_job_titles(tenant_id)
        return [
            JobTitleSimple.model_validate(job_title) 
            for job_title in job_titles
        ]

    async def create_job_title(self, tenant_id: str, data: JobTitleCreate) -> JobTitleResponse:
        existing = await self.repo.get_job_title_by_code(data.code, tenant_id)
        if existing is not None:
            raise JobTitleAlreadyExistsError()
                
        job_title = JobTitle(
            tenant_id=tenant_id,
            title_name=data.title_name,
            code=data.code,
            description=data.description
        )

        return JobTitleResponse.model_validate(
            await self.repo.create_job_title(job_title)
        )
    
    async def get_job_title_by_id(self, tenant_id: str, job_title_id: str) -> JobTitleResponse:
        job_title = await self.repo.get_job_title_by_id(job_title_id)
        if job_title is None or job_title.tenant_id != tenant_id:
            raise NotFoundError()
        return JobTitleResponse.model_validate(job_title)

    async def update_job_title(self, tenant_id: str, 
        job_title_id: str, data: JobTitleUpdate
    ) -> JobTitleResponse:
        existing = await self.repo.get_job_title_by_id(job_title_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        if data.title_name is not None:
            existing.title_name = data.title_name
        if data.description is not None:
            existing.description = data.description

        await self.repo.save(job_title=existing)
        return JobTitleResponse.model_validate(existing)
    
    async def delete_job_title(self, tenant_id: str, job_title_id: str) -> JobTitleResponse:
        existing = await self.repo.get_job_title_by_id(job_title_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        response = JobTitleResponse.model_validate(existing)
        await self.repo.delete_job_title(existing)
        return response
