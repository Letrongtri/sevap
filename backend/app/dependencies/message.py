from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.ai_brain.router.intent_router import IntentRouter
from app.ai_brain.retrieval import PARRepository
from app.dependencies.db import get_db
from app.repositories import ConversationRepository, MessageRepository
from app.services import MessageService


def get_message_service(
        db: AsyncSession = Depends(get_db)
) -> MessageService:
    msg_repo = MessageRepository(db)
    conv_repo = ConversationRepository(db)
    par_repo = PARRepository(db)
    intent_router = IntentRouter(db)
    return MessageService(msg_repo, conv_repo, par_repo, intent_router)