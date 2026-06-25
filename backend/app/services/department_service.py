import math
from typing import List

from app.models import Department
from app.repositories import DepartmentRepository
from app.services.exceptions import (
    DepartmentAlreadyExistsError, 
    NotFoundError,
)
from app.schemas import (
    DepartmentSimple, DepartmentResponse, DepartmentCreate,
    DepartmentUpdate, PaginationQuery, DepartmentQuery, 
    DepartmentPaginatedResponse, PaginationResponse
)

class DepartmentService:
    def __init__(self, repo: DepartmentRepository):
        self.repo = repo
    
    async def get_all_departments(self, 
        tenant_id: str, 
        pagination: PaginationQuery,
        query: DepartmentQuery
    ) -> DepartmentPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        departments, total_records = await self.repo.get_all_departments(
            tenant_id, query=query.query,
            skip=skip, limit=pagination.limit
        )

        total_pages = (
            math.ceil(total_records / pagination.limit) 
            if total_records > 0 else 0
        )

        return DepartmentPaginatedResponse(
            departments=[
                DepartmentResponse.model_validate(department) 
                for department in departments
            ],
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )

    async def get_all_simple_departments(self, 
        tenant_id: str
    ) -> List[DepartmentSimple]:

        departments = await self.repo.get_all_simple_departments(tenant_id)
        return [
            DepartmentSimple.model_validate(department) 
            for department in departments
        ]

    async def create_department(
        self, tenant_id: str, user_id: str, 
        data: DepartmentCreate
    ) -> DepartmentResponse:
        existing = await self.repo.get_department_by_code(data.code, tenant_id)
        if existing is not None:
            raise DepartmentAlreadyExistsError()
                
        department = Department(
            tenant_id=tenant_id,
            name=data.name,
            code=data.code,
            description=data.description,
        )

        created = await self.repo.create_department(department)
        return DepartmentResponse.model_validate(created)
    
    async def get_department_by_id(
        self, 
        tenant_id: str, 
        department_id: str
    ) -> DepartmentResponse:
        existing = await self.repo.get_department_by_id(department_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()

        return DepartmentResponse.model_validate(existing)

    async def update_department(
        self, 
        tenant_id: str, 
        department_id: str, 
        data: DepartmentUpdate
    ) -> DepartmentResponse:
        existing = await self.repo.get_department_by_id(department_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        if data.name is not None:
            existing.name = data.name
        if data.description is not None:
            existing.description = data.description

        await self.repo.save(department=existing)
        return DepartmentResponse.model_validate(existing)
    
    async def delete_department(self, 
        tenant_id: str, 
        department_id: str
    ) -> DepartmentResponse:
        existing = await self.repo.get_department_by_id(department_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        response = DepartmentResponse.model_validate(existing)
        await self.repo.delete_department(existing)
        return response
