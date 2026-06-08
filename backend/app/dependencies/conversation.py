from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.repositories import ConversationRepository, MessageRepository
from app.services import ConversationService

def get_conversation_service(
        db: AsyncSession = Depends(get_db)
) -> ConversationService:
    repo = ConversationRepository(db)
    message_repo = MessageRepository(db)
    return ConversationService(repo, message_repo)