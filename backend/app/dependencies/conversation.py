from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.repositories.conversation_repository import ConversationRepository
from app.services.conversation_service import ConversationService

def get_conversation_service(
        db: AsyncSession = Depends(get_db)
) -> ConversationService:
    repo = ConversationRepository(db)
    return ConversationService(repo)