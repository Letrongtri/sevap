from sqlalchemy import select

from app.models import Permission
from app.core.enum import PermissionResource


class PermissionRepository:
    def __init__(self, db):
        self.db = db

    async def get_permissions_by_ids(self, 
                                     permission_ids: list[int]) -> list[Permission]:

        stmt = select(Permission).where(
            Permission.id.in_(permission_ids)
        )

        result = await self.db.execute(stmt)

        return list(result.scalars().all())

    async def get_all_permissions(
        self, get_tenant_permissions: bool = False
    ) -> list[Permission]:
        stmt = select(Permission)

        if not get_tenant_permissions:
            stmt = stmt.where(
                Permission.resource != PermissionResource.TENANTS.value
            )
        
        stmt = stmt.order_by(Permission.id.asc())

        result = await self.db.execute(stmt)

        return list(result.scalars().all())