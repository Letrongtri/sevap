from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.repositories import ConversationRepository
from app.services import ConversationService

def get_conversation_service(
        db: AsyncSession = Depends(get_db)
) -> ConversationService:
    repo = ConversationRepository(db)
    return ConversationService(repo)