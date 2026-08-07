from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models import PromptTemplate

class PromptTemplateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_prompt_templates(
        self,
        tenant_id: str,
        query: str = None,
        type: str = None,
        is_active: bool = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[list[PromptTemplate], int]:
        stmt = select(PromptTemplate).where(
            PromptTemplate.tenant_id == tenant_id
        )

        if query:
            stmt = stmt.where(
                PromptTemplate.name.ilike(f"%{query}%") |
                PromptTemplate.description.ilike(f"%{query}%")
            )

        if type is not None:
            stmt = stmt.where(PromptTemplate.type == type)

        if is_active is not None:
            stmt = stmt.where(PromptTemplate.is_active == is_active)

        total_stmt = stmt.with_only_columns(func.count(PromptTemplate.id))
        total_result = await self.db.execute(total_stmt)
        total = total_result.scalar_one()

        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        return items, total

    async def get_prompt_template_by_id(self, prompt_template_id: str):
        stmt = select(PromptTemplate).where(
            PromptTemplate.id == prompt_template_id
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all_active_by_tenant(self, tenant_id: str) -> list["PromptTemplate"]:
        """Lấy tất cả prompt templates đang active của tenant — 1 query duy nhất."""
        stmt = select(PromptTemplate).where(
            PromptTemplate.tenant_id == tenant_id,
            PromptTemplate.is_active == True,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_prompt_template_by_type(self, tenant_id: str, type: str):
        stmt = select(PromptTemplate).where(
            PromptTemplate.type == type, 
            PromptTemplate.tenant_id == tenant_id,
            PromptTemplate.is_active == True
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_prompt_template(self, prompt_template: PromptTemplate):
        try:
            existing = await self.get_active_prompt_template_by_type(prompt_template.tenant_id, prompt_template.type)
            if existing is not None:
                existing.is_active = False
                await self.save(existing)

            self.db.add(prompt_template)
            await self.db.commit()
            return await self.get_prompt_template_by_id(prompt_template.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, prompt_template: PromptTemplate):
        try:
            await self.db.commit()
            return await self.get_prompt_template_by_id(prompt_template.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def delete_prompt_template(self, prompt_template: PromptTemplate):
        try:
            await self.db.delete(prompt_template)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
