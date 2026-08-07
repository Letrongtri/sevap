from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models import PromptTemplate

    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_prompt_templates(
        """Lấy tất cả prompt templates đang active của tenant — 1 query duy nhất."""
        stmt = select(PromptTemplate).where(
            PromptTemplate.tenant_id == tenant_id,
            PromptTemplate.is_active == True,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_prompt_template_by_type(self, tenant_id: str, type: str):
