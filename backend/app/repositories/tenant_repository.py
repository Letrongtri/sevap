from sqlalchemy import func
from app.core.enum import TenantStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Tenants

class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_tenant_by_id(self, tenant_id: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.id == tenant_id, Tenants.status != "deleted")
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_tenant_by_email(self, email: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.company_email == email, Tenants.status != "deleted")
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_tenant_by_domain(self, domain: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.tenant_domain == domain, Tenants.status != "deleted")
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_tenant_by_name(self, name: str) -> Tenants | None:
        stmt = select(Tenants).where(Tenants.company_name == name, Tenants.status != "deleted")
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

    async def get_tenants(self, 
        query: str | None,
        status: TenantStatus | None,
        skip: int,
        limit: int
    ) -> tuple[list[Tenants], int]:
        stmt = select(Tenants)

        if query:
            stmt = stmt.where(
                Tenants.company_name.ilike(f"%{query}%") |
                Tenants.company_description.ilike(f"%{query}%") |
                Tenants.company_email.ilike(f"%{query}%") |
                Tenants.company_phone.ilike(f"%{query}%") |
                Tenants.company_address.ilike(f"%{query}%") |
                Tenants.tenant_domain.ilike(f"%{query}%")
            )
        
        if status:
            stmt = stmt.where(Tenants.status == status)
        else:
            stmt = stmt.where(Tenants.status != TenantStatus.DELETED)
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)
        
        stmt = stmt.offset(skip).limit(limit)

        result = await self.db.execute(stmt)

        tenants = result.unique().scalars().all()

        return list(tenants), total_records
