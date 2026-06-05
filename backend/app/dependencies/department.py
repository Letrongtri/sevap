from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import DepartmentRepository
from app.services import DepartmentService


def get_department_service(
        db: AsyncSession = Depends(get_db)
) -> DepartmentService:
    repo = DepartmentRepository(db)
    return DepartmentService(repo)