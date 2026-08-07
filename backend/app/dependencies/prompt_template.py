from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import PromptTemplateRepository
from app.services import PromptTemplateService


def get_prompt_template_service(
        db: AsyncSession = Depends(get_db)
) -> PromptTemplateService:
    repo = PromptTemplateRepository(db)
    return PromptTemplateService(repo)