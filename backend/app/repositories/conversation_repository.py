from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import Conversation, Message

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversation_by_id(
        self, 
        conversation_id: int
    ):
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_conversation(self, conversation: Conversation):
        try:
            self.db.add(conversation)
            await self.db.commit()
            return await self.get_conversation_by_id(conversation.id)
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_all_conversations_by_user_id(self, user_id: int):
        stmt = select(Conversation).where(Conversation.user_id == user_id, Conversation.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def save(self, conversation: Conversation):
        try:
            await self.db.commit()
            await self.db.refresh(conversation)
        except Exception as e:
            await self.db.rollback()
            raise e
