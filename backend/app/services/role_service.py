import math
from typing import List

from app.models import Role
from app.repositories import RoleRepository, PermissionRepository
from app.services.exceptions import (
    RoleAlreadyExistsError, 
    NotFoundError,
)
from app.schemas import (
    RoleSimple, RoleQuery, PaginationQuery, RoleCreate, RoleUpdate, 
    RolePaginatedResponse, RoleResponse, PaginationResponse
)

class RoleService:
    def __init__(self, 
        repo: RoleRepository, 
        permission_repo: PermissionRepository
    ):
        self.repo = repo
        self.permission_repo = permission_repo
    
    async def get_all_roles(
        self,
        tenant_id: str,
        query: RoleQuery,
        pagination: PaginationQuery
    ) -> RolePaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        roles, total = await self.repo.get_all_roles(
            tenant_id,
            query=query.query,
            is_system=query.is_system,
            skip=skip,
            limit=pagination.limit
        )

        total_pages = math.ceil(total / pagination.limit) if total > 0 else 0
        return RolePaginatedResponse(
            roles=[
                RoleResponse.model_validate(role)
                for role in roles
            ],
            pagination=PaginationResponse(
                total=total,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )

    async def get_all_simple_roles(self, tenant_id: str) -> List[RoleSimple]:
        roles = await self.repo.get_all_simple_roles(tenant_id)
        return [
            RoleSimple(id=role.id, name=role.name) 
            for role in roles
        ]

    async def create_role(self, tenant_id: str, data: RoleCreate) -> RoleResponse:
        existing = await self.repo.get_role_by_name(tenant_id, data.name)
        if existing is not None:
            raise RoleAlreadyExistsError()
                
        role = Role(
            tenant_id=tenant_id,
            name=data.name, 
            description=data.description, 
            access_level=data.access_level, 
            is_system=False
        )

        if data.permission_ids is not None:
            permission_objects = await self.permission_repo.get_permissions_by_ids(data.permission_ids)

            if len(permission_objects) != len(set(data.permission_ids)):
                raise Exception("Some permissions do not exist")

            role.permissions = permission_objects

        created_role = await self.repo.create_role(role)
        return RoleResponse.model_validate(created_role)
    
    async def get_role_by_id(self, tenant_id: str, role_id: str) -> RoleResponse:
        role = await self.repo.get_role_by_id(role_id)
        if role is None or role.tenant_id != tenant_id:
            raise NotFoundError()
        return RoleResponse.model_validate(role)

    async def update_role(self, tenant_id: str, role_id: str, data: RoleUpdate) -> RoleResponse:
        existing = await self.repo.get_role_by_id(role_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        if data.name is not None and not existing.is_system:
            existing.name = data.name
        if data.description is not None:
            existing.description = data.description
        if data.access_level is not None:
            existing.access_level = data.access_level
        
        if data.permission_ids is not None:
            permission_objects = await self.permission_repo.get_permissions_by_ids(data.permission_ids)

            if len(permission_objects) != len(set(data.permission_ids)):
                raise Exception("Some permissions do not exist")

            existing.permissions = permission_objects

        updated = await self.repo.save(role=existing)
        return RoleResponse.model_validate(updated)
    
    async def delete_role(self, tenant_id: str, role_id: str) -> RoleResponse:
        existing = await self.repo.get_role_by_id(role_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        if existing.is_system:
            raise Exception("Cannot delete system role")
        
        response = RoleResponse.model_validate(existing)
        await self.repo.delete_role(existing)
        return response
