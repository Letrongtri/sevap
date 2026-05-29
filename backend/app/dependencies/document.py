from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories.document_repository import DocumentRepository
from app.services.document_service import DocumentService


def get_document_service(
        db: AsyncSession = Depends(get_db)
) -> DocumentService:
    repo = DocumentRepository(db)
    return DocumentService(repo)