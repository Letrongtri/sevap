from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Tenants

class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_tenant_by_id(self, tenant_id: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.id == tenant_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_tenant_by_name(self, name: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.company_name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_tenant_by_email(self, email: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.company_email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_tenant_by_domain(self, domain: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.tenant_domain == domain)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_tenant(self, tenant: Tenants) -> Tenants:
        try:
            self.db.add(tenant)
            await self.db.commit()
            await self.db.refresh(tenant)
            return tenant
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, tenant: Tenants) -> Tenants:
        try:
            await self.db.commit()
            await self.db.refresh(tenant)
            return tenant
        except Exception as e:
            await self.db.rollback()
            raise e
