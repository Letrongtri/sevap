from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_, String

from app.models import Message, Conversation

class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_message_by_id(self, message_id: str):
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
        self, conversation_id: str, 
        limit: int = 10, last_id: str | None = None
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
    
    async def count_all_messages(
        self, tenant_id: str, group_by: str, from_date: datetime, to_date: datetime
    ) -> list[tuple[str, int]]:
        # PostgreSQL date_trunc không nhận "date", phải dùng "day"
        pg_group_by = "day" if group_by == "date" else group_by
        date_label = func.date_trunc(
            pg_group_by, Message.created_at
        ).cast(String).label("time_bucket")
        
        stmt = (
            select(
                date_label,
                func.count(Message.id).label("message_count")
            )
            .join(
                Conversation,
                Conversation.id == Message.conversation_id
            )
            .where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.is_deleted == False,
                    Message.created_at >= from_date,
                    Message.created_at <= to_date
                )
            )
            .group_by("time_bucket")
            .order_by("time_bucket")
        )

        result = await self.db.execute(stmt)
        return result.all()
