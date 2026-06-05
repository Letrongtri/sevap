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
    