from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Tenants, Role, Permission, RolePermission, User, UserRole
from app.repositories import TenantRepository
from app.services.exceptions import TenantAlreadyExistsError, NotFoundError
from app.utils.auth import hash_password
from app.core.enum import TenantStatus
from app.schemas import TenantCreate, TenantResponse, TenantUpdate

class TenantService:
    def __init__(self, tenant_repo: TenantRepository, db: AsyncSession):
        self.tenant_repo = tenant_repo
        self.db = db

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
            # 1. Create the tenant
            tenant = Tenants(
                tenant_domain=data.tenant_domain,
                company_name=data.company_name,
                company_description=data.company_description,
                company_email=data.company_email,
                company_phone=data.company_phone,
                company_address=data.company_address,
                status=TenantStatus.ACTIVE.value
            )
            self.db.add(tenant)
            await self.db.flush() # Get tenant ID

            # 2. Create default roles for this tenant
            roles = [
                Role(
                    tenant_id=tenant.id,
                    name="admin", 
                    description="Quản trị viên hệ thống, toàn quyền truy cập", 
                    access_level="managerial", 
                    is_system=True
                ),
                Role(
                    tenant_id=tenant.id,
                    name="manager", 
                    description="Quản lý Nhân sự", 
                    access_level="managerial", 
                    is_system=True
                ),
                Role(
                    tenant_id=tenant.id,
                    name="employee", 
                    description="Nhân viên tiêu chuẩn, truy cập dữ liệu public/private", 
                    access_level="private", 
                    is_system=True
                ),
                Role(
                    tenant_id=tenant.id,
                    name="guest", 
                    description="Khách hoặc Thực tập sinh, chỉ đọc dữ liệu public", 
                    access_level="public", 
                    is_system=True
                )
            ]
            self.db.add_all(roles)
            await self.db.flush()

            # 3. Fetch global permissions
            result = await self.db.execute(select(Permission))
            permissions_data = result.scalars().all()

            # 4. Map permissions to roles for this tenant
            role_map = {r.name: r for r in roles}
            
            admin_perms = permissions_data
            manager_perms = [p for p in permissions_data if p.resource in ["users", "documents", "reports", "chat", "tasks"] and p.action != "delete"]
            employee_perms = [p for p in permissions_data if (p.resource == "documents" and p.action == "read") or (p.resource == "chat" and p.action == "read") or (p.resource == "tasks" and p.action == "execute")]
            guest_perms = [p for p in permissions_data if p.resource == "documents" and p.action == "read"]

            role_permissions = []
            for p in admin_perms:
                role_permissions.append(RolePermission(role_id=role_map["admin"].id, permission_id=p.id))
            for p in manager_perms:
                role_permissions.append(RolePermission(role_id=role_map["manager"].id, permission_id=p.id))
            for p in employee_perms:
                role_permissions.append(RolePermission(role_id=role_map["employee"].id, permission_id=p.id))
            for p in guest_perms:
                role_permissions.append(RolePermission(role_id=role_map["guest"].id, permission_id=p.id))

            self.db.add_all(role_permissions)
            await self.db.flush()

            # 5. Create admin user for this tenant
            admin_user = User(
                employee_code=data.admin_employee_code,
                email=data.admin_email,
                full_name=data.admin_full_name,
                password=hash_password(data.admin_password),
                is_active=True,
                tenant_id=tenant.id
            )
            self.db.add(admin_user)
            await self.db.flush()

            # 6. Assign admin role to this user
            admin_role_mapping = UserRole(
                user_id=admin_user.id,
                role_id=role_map["admin"].id,
                assigned_by=admin_user.id
            )
            self.db.add(admin_role_mapping)

            await self.db.commit()
            await self.db.refresh(tenant)
            return TenantResponse.model_validate(tenant)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def get_tenant_by_id(self, tenant_id: str) -> TenantResponse:
        tenant = await self.tenant_repo.get_tenant_by_id(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return TenantResponse.model_validate(tenant)

    async def update_tenant(self, tenant_id: str, data: TenantUpdate) -> TenantResponse:
        tenant = await self.get_tenant_by_id(tenant_id)
        
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
        tenant = await self.get_tenant_by_id(tenant_id)
        tenant.status = TenantStatus.DELETED.value
        updated_tenant = await self.tenant_repo.save(tenant)
        return TenantResponse.model_validate(updated_tenant)
