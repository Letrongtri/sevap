from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversation_by_id(self, conversation_id: int, get_messages: bool = False):
        stmt = select(Conversation).where(Conversation.id == conversation_id)

        if get_messages:
            stmt = stmt.options(selectinload(Conversation.messages))

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_conversation(self, conversation: Conversation):
        try:
            self.db.add(conversation)
            await self.db.commit()
            return await self.get_conversation_by_id(conversation.id, get_messages=True)
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_all_conversations(self):
        stmt = select(Conversation)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def save(self, conversation: Conversation):
        try:
            await self.db.commit()
            await self.db.refresh(conversation)
        except Exception as e:
            await self.db.rollback()
            raise e
