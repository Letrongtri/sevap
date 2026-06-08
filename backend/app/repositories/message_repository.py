from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import Message

class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_message_by_id(self, message_id: int):
        stmt = select(Message).where(Message.id == message_id)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_message(self, message: Message):
        try:
            self.db.add(message)
            await self.db.commit()
            return await self.get_message_by_id(message.id)
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_messages_by_conversation_id(
        self, 
        conversation_id: int, 
        limit: int = 10, 
        last_id: int | None = None
    ):
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id.desc())
            .limit(limit)
        )
        if last_id:
            stmt = stmt.where(Message.id < last_id)
            
        result = await self.db.execute(stmt)
        return result.scalars().all()
    
    async def save(self, message: Message):
        try:
            await self.db.commit()
            await self.db.refresh(message)
        except Exception as e:
            await self.db.rollback()
            raise e