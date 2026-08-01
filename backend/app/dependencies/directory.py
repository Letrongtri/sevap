from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import DirectoryRepository
from app.services import DirectoryService
from app.ai_brain.retrieval.repository import PARRepository


def get_directory_service(
        db: AsyncSession = Depends(get_db)
) -> DirectoryService:
    repo = DirectoryRepository(db)
    par_repo = PARRepository(db)
    return DirectoryService(repo, par_repo)