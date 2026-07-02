from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import DocumentRepository, RoleRepository, UserRepository
from app.services import DocumentService

def get_document_service(
        db: AsyncSession = Depends(get_db)
) -> DocumentService:
    repo = DocumentRepository(db)
    role_repo = RoleRepository(db)
    user_repo = UserRepository(db)
    return DocumentService(repo, role_repo, user_repo)