from sqlalchemy import select

from app.models import Permission


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

    async def get_all_permissions(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.id.asc())

        result = await self.db.execute(stmt)

        return list(result.scalars().all())