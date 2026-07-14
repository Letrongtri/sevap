from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.retrieval.service import RetrievalService


def get_par_repository(
    db: AsyncSession = Depends(get_db),
) -> PARRepository:
    """
    Dependency trả về PARRepository scoped theo request.

    PARRepository KHÔNG được là singleton vì nó giữ tham chiếu
    đến AsyncSession — một object scoped per-request. Dùng singleton
    sẽ gây race condition và transaction leak giữa các request.
    """
    return PARRepository(db)


def get_retrieval_service(
    repo: PARRepository = Depends(get_par_repository),
) -> RetrievalService:
    """
    Dependency trả về RetrievalService đã được wire sẵn:
      - repo: PARRepository (scoped per-request, chứa AsyncSession)
      - Embedding thực hiện qua document_embedder singleton (tự inject trong service)
    """
    return RetrievalService(repo=repo)
