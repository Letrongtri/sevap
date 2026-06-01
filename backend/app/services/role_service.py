from typing import List

from app.models import Role
from app.repositories import RoleRepository, PermissionRepository
from app.services import (
    RoleAlreadyExistsError, 
    NotFoundError,
)

class RoleService:
    def __init__(self, repo: RoleRepository, permission_repo: PermissionRepository):
        self.repo = repo
        self.permission_repo = permission_repo
    
    async def get_all_roles(self) -> List[Role]:
        return await self.repo.get_all_roles()

    async def create_role(self, name: str, description: str | None = None, 
                          access_level: int | None = None, 
                          permissions: List[int] | None = None) -> Role:
        existing = await self.repo.get_role_by_name(name)
        if existing is not None:
            raise RoleAlreadyExistsError()
                
        role = Role(
            name=name, 
            description=description, 
            access_level=access_level, 
            is_system=False
        )

        if permissions is not None:
            permission_objects = await self.permission_repo.get_permissions_by_ids(permissions)

            if len(permission_objects) != len(set(permissions)):
                raise Exception("Some permissions do not exist")

            role.permissions = permission_objects

        return await self.repo.create_role(role)
    
    async def get_role_by_id(self, role_id: int) -> Role | None:
        role = await self.repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError()
        return role

    async def update_role(self, role_id: int, name: str | None = None, 
                          description: str | None = None, access_level: str | None = None, 
                          permissions: list[int] | None = None) -> Role:
        existing = await self.repo.get_role_by_id(role_id)
        if existing is None:
            raise NotFoundError()
        
        if name is not None and not existing.is_system:
            existing.name = name
        if description is not None:
            existing.description = description
        if access_level is not None:
            existing.access_level = access_level
        
        if permissions is not None:
            permission_objects = await self.permission_repo.get_permissions_by_ids(permissions)

            if len(permission_objects) != len(set(permissions)):
                raise Exception("Some permissions do not exist")

            existing.permissions = permission_objects

        await self.repo.save(role=existing)
        return existing
    
    async def delete_role(self, role_id: int) -> Role:
        existing = await self.repo.get_role_by_id(role_id)
        if existing is None:
            raise NotFoundError()
        
        if existing.is_system:
            raise Exception("Cannot delete system role")
        
        await self.repo.delete_role(existing)
        return existing
