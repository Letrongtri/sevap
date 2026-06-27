from app.repositories import PermissionRepository
from app.schemas import PermissionResponse

class PermissionService:
    def __init__(self, repo: PermissionRepository):
        self.repo = repo
    
    async def get_all_permissions(self, is_global_admin: bool = False) -> list[PermissionResponse]:
        permissions = await self.repo.get_all_permissions(
            get_tenant_permissions=is_global_admin
        )
        return [
            PermissionResponse(
                id=permission.id,
                resource=permission.resource,
                action=permission.action,
                description=permission.description,
            )
            for permission in permissions
        ]
