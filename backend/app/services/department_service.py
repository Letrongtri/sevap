from typing import List

from app.models import Department
from app.repositories import DepartmentRepository
from app.services.exceptions import (
    DepartmentAlreadyExistsError, 
    NotFoundError,
)

class DepartmentService:
    def __init__(self, repo: DepartmentRepository):
        self.repo = repo
    
    async def get_all_departments(self) -> List[Department]:
        return await self.repo.get_all_departments()

    async def create_department(self, name: str, code: str, 
                                description: str | None = None, parent_id: int | None = None, 
                                manager_id: int | None = None) -> Department:
        existing = await self.repo.get_department_by_code(code)
        if existing is not None:
            raise DepartmentAlreadyExistsError()
                
        department = department(
            name=name,
            code=code,
            description=description, 
            parent_id=parent_id, 
            manager_id=manager_id
        )

        return await self.repo.create_department(department)
    
    async def get_department_by_id(self, department_id: int) -> Department | None:
        department = await self.repo.get_department_by_id(department_id)
        if department is None:
            raise NotFoundError()
        return department

    async def update_department(self, department_id: int, name: str | None = None, 
                          description: str | None = None, parent_id: int | None = None, 
                          manager_id: int | None = None) -> Department:
        existing = await self.repo.get_department_by_id(department_id)
        if existing is None:
            raise NotFoundError()
        
        if name is not None:
            existing.name = name
        if description is not None:
            existing.description = description
        if parent_id is not None:
            existing.parent_id = parent_id
        if manager_id is not None:
            existing.manager_id = manager_id

        await self.repo.save(department=existing)
        return existing
    
    async def delete_department(self, department_id: int) -> Department:
        existing = await self.repo.get_department_by_id(department_id)
        if existing is None:
            raise NotFoundError()
        
        await self.repo.delete_department(existing)
        return existing
