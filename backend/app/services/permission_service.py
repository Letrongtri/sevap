from app.repositories import PermissionRepository
from app.schemas import PermissionResponse

class PermissionService:
    def __init__(self, repo: PermissionRepository):
        self.repo = repo
    
    async def get_all_permissions(self) -> list[PermissionResponse]:
        permissions = await self.repo.get_all_permissions()
        return [
            PermissionResponse(
                id=permission.id,
                resource=permission.resource,
                action=permission.action,
                description=permission.description,
            )
            for permission in permissions
        ]
