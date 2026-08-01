import uuid_utils
import math
from typing import Dict
from app.models import Tenants, Role, Permission, User, UserRole
from app.repositories import TenantRepository, PermissionRepository
from app.services.exceptions import TenantAlreadyExistsError, NotFoundError
from app.utils.auth import hash_password
from app.core.enum import (
    TenantStatus, PermissionAction, PermissionResource,
    DefaultRole
)
from app.core.default_roles import DEFAULT_ROLES
from app.schemas import (
    TenantCreate, TenantResponse, TenantUpdate,
    TenantPaginatedResponse, TenantQuery, PaginationQuery,
    PaginationResponse
)

class TenantService:
    def __init__(
        self,
        tenant_repo: TenantRepository, 
        permission_repo: PermissionRepository
    ):
        self.tenant_repo = tenant_repo
        self.permission_repo = permission_repo

    async def register_tenant(self, data: TenantCreate) -> TenantResponse:
        # Check if tenant already exists by email, or domain            
        existing_email = await self.tenant_repo.get_tenant_by_email(data.company_email)
        if existing_email:
            raise TenantAlreadyExistsError("Company email already registered")

        if data.tenant_domain:
            existing_domain = await self.tenant_repo.get_tenant_by_domain(data.tenant_domain)
            if existing_domain:
                raise TenantAlreadyExistsError("Tenant domain already registered")

        try:
            global_permissions = await self.permission_repo.get_all_permissions()

            perm_map: Dict[str, Dict[str, Permission]] = {}
            for p in global_permissions:
                if p.resource not in perm_map:
                    perm_map[p.resource] = {}
                perm_map[p.resource][p.action] = p
            
            # Hàm phụ trợ bóc tách danh sách Object Permission dựa vào ma trận định sẵn
            def filter_permissions(role_cfg: dict) -> list[Permission]:
                matched_perms = []
                cfg_perms: Dict[PermissionResource, list[PermissionAction]] = role_cfg.get("permissions", {})
                for res, actions in cfg_perms.items():
                    res_str = res.value if hasattr(res, 'value') else str(res)
                    for act in actions:
                        act_str = act.value if hasattr(act, 'value') else str(act)
                        if res_str in perm_map and act_str in perm_map[res_str]:
                            matched_perms.append(perm_map[res_str][act_str])
                return matched_perms

            tenant_id = str(uuid_utils.uuid7())
            admin_user_id = str(uuid_utils.uuid7())
            
            tenant = Tenants(
                id=tenant_id,
                tenant_domain=data.tenant_domain,
                company_name=data.company_name,
                company_description=data.company_description,
                company_email=data.company_email,
                company_phone=data.company_phone,
                company_address=data.company_address,
                status=TenantStatus.ACTIVE.value
            )

            roles_by_name: Dict[str, Role] = {}
    
            for r_key in [DefaultRole.ADMIN, DefaultRole.HR_MANAGER, DefaultRole.EMPLOYEE]:
                r_cfg = DEFAULT_ROLES[r_key]
                
                role_obj = Role(
                    id=str(uuid_utils.uuid7()),
                    tenant_id=tenant_id,
                    name=r_cfg["name"],
                    description=r_cfg["description"],
                    access_level=r_cfg["access_level"].value if hasattr(r_cfg["access_level"], 'value') else r_cfg["access_level"],
                    is_system=True,
                    permissions=filter_permissions(r_cfg) # Gán quan hệ Many-to-Many với Permissions qua bảng trung gian
                )
                # Thêm vào collection của Tenant (SQLAlchemy sẽ tự nhận diện khi lưu Tenant)
                tenant.roles.append(role_obj)
                roles_by_name[r_key] = role_obj

            # 5. Create admin user for this tenant
            admin_user = User(
                id=admin_user_id,
                tenant_id=tenant_id,
                employee_code=data.admin_employee_code,
                email=data.admin_email,
                full_name=data.admin_full_name,
                password=hash_password(data.admin_password),
                is_active=True
            )

            admin_role_mapping = UserRole(
                user_id=admin_user_id,
                role_id=roles_by_name[DefaultRole.ADMIN].id,
                assigned_by=admin_user_id,
            )
            
            admin_user.role_associations.append(admin_role_mapping)
            tenant.users.append(admin_user)

            new_tenant = await self.tenant_repo.create_tenant(tenant)
            return TenantResponse.model_validate(new_tenant)
        except Exception as e:
            raise e

    async def get_tenant_by_id(self, tenant_id: str) -> TenantResponse:
        tenant = await self.tenant_repo.get_tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return TenantResponse.model_validate(tenant)

    async def update_tenant(self, tenant_id: str, data: TenantUpdate) -> TenantResponse:
        tenant = await self.tenant_repo.get_tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        
        if data.company_name is not None:
            # Check unique name
            existing = await self.tenant_repo.get_tenant_by_name(data.company_name)
            if existing and existing.id != tenant_id:
                raise TenantAlreadyExistsError("Company name already registered by another tenant")
            tenant.company_name = data.company_name

        if data.company_email is not None:
            # Check unique email
            existing = await self.tenant_repo.get_tenant_by_email(data.company_email)
            if existing and existing.id != tenant_id:
                raise TenantAlreadyExistsError("Company email already registered by another tenant")
            tenant.company_email = data.company_email

        if data.tenant_domain is not None:
            # Check unique domain
            existing = await self.tenant_repo.get_tenant_by_domain(data.tenant_domain)
            if existing and existing.id != tenant_id:
                raise TenantAlreadyExistsError("Tenant domain already registered by another tenant")
            tenant.tenant_domain = data.tenant_domain

        if data.company_description is not None:
            tenant.company_description = data.company_description
        if data.company_phone is not None:
            tenant.company_phone = data.company_phone
        if data.company_address is not None:
            tenant.company_address = data.company_address
        if data.status is not None:
            tenant.status = data.status.value

        updated_tenant = await self.tenant_repo.save(tenant)
        return TenantResponse.model_validate(updated_tenant)

    async def soft_delete_tenant(self, tenant_id: str) -> TenantResponse:
        tenant = await self.tenant_repo.get_tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        tenant.status = TenantStatus.DELETED.value
        updated_tenant = await self.tenant_repo.save(tenant)
        # TODO: soft delete all users in tenant, also revoke all roles in tenant
        
        return TenantResponse.model_validate(updated_tenant)

    async def get_tenants(
        self, 
        query: TenantQuery, 
        pagination: PaginationQuery
    ) -> TenantPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        tenants, total_records = await self.tenant_repo.get_tenants(
            query=query.query,
            status=query.status,
            skip=skip,
            limit=pagination.limit
        )

        total_pages = (
            math.ceil(total_records / pagination.limit) 
            if total_records > 0 else 0
        )

        return TenantPaginatedResponse(
            tenants=[
                TenantResponse.model_validate(tenant)
                for tenant in tenants
            ],
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )
