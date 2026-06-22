from app.utils.auth import verify_token
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Tenants, User, Role
from app.core.enum import TenantStatus

@pytest.mark.asyncio
async def test_register_tenant_success(async_client: AsyncClient, db_session: AsyncSession):
    register_data = {
        "tenant_domain": "newtenant.local",
        "company_name": "New Tenant Co",
        "company_description": "A brand new company",
        "company_email": "info@newtenant.local",
        "company_phone": "0987654321",
        "company_address": "456 New St",
        "admin_employee_code": "tenant_admin",
        "admin_full_name": "Tenant Administrator",
        "admin_email": "admin@newtenant.local",
        "admin_password": "SecurePassword@123"
    }
    
    response = await async_client.post("/api/v1/tenants/register", json=register_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["company_name"] == "New Tenant Co"
    assert data["tenant_domain"] == "newtenant.local"
    assert data["status"] == TenantStatus.ACTIVE.value
    
    # Verify DB records
    # 1. Tenant is saved
    res_tenant = await db_session.execute(select(Tenants).filter_by(tenant_domain="newtenant.local"))
    tenant = res_tenant.scalars().first()
    assert tenant is not None
    
    # 2. Standard roles exist for this tenant
    res_roles = await db_session.execute(select(Role).filter_by(tenant_id=tenant.id))
    roles = res_roles.scalars().all()
    role_names = [r.name for r in roles]
    assert "admin" in role_names
    assert "manager" in role_names
    assert "employee" in role_names
    
    # 3. First admin user exists for this tenant
    res_user = await db_session.execute(select(User).filter_by(tenant_id=tenant.id, employee_code="tenant_admin"))
    user = res_user.scalars().first()
    assert user is not None
    assert user.full_name == "Tenant Administrator"

@pytest.mark.asyncio
async def test_register_tenant_conflict_domain(async_client: AsyncClient, db_session: AsyncSession):
    # Registering a tenant with system.hrnexus.com domain (which is seeded)
    register_data = {
        "tenant_domain": "system.hrnexus.com",
        "company_name": "Conflict Co",
        "company_email": "conflict@domain.local",
        "company_phone": "0912345678",
        "company_address": "123 Main St",
        "admin_employee_code": "conflict_admin",
        "admin_full_name": "Conflict Admin",
        "admin_email": "admin@conflict.local",
        "admin_password": "SecurePassword@123"
    }
    
    response = await async_client.post("/api/v1/tenants/register", json=register_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_update_tenant_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded tenant
    res = await db_session.execute(select(Tenants).filter_by(tenant_domain="system.hrnexus.com"))
    tenant = res.scalars().first()
    assert tenant is not None
    
    headers = await admin_headers()
    update_data = {
        "company_name": "System Default Updated",
        "company_address": "New Headquarter Address"
    }
    
    response = await async_client.put("/api/v1/tenants", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["company_name"] == "System Default Updated"
    assert data["company_address"] == "New Headquarter Address"

@pytest.mark.asyncio
async def test_update_tenant_unauthorized(async_client: AsyncClient, db_session: AsyncSession):
    update_data = {
        "company_name": "Unauthorized Update"
    }
    response = await async_client.put("/api/v1/tenants", json=update_data)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_soft_delete_tenant_success(
    async_client: AsyncClient,
    db_session,
    admin_headers
):
    headers = await admin_headers()

    # Lấy tenant_id từ token đang dùng
    token = headers["Authorization"].split(" ")[1]
    payload = verify_token(token)
    tenant_id = payload["tenant_id"]

    # Đảm bảo tenant đang active trước khi delete
    result = await db_session.execute(
        select(Tenants).where(Tenants.id == tenant_id)
    )
    tenant = result.scalar_one()

    tenant.status = TenantStatus.ACTIVE.value
    await db_session.commit()

    # Call API
    response = await async_client.delete(
        "/api/v1/tenants",
        headers=headers
    )

    assert response.status_code == 200

    body = response.json()
    assert body["id"] == tenant_id
    assert body["status"] == TenantStatus.DELETED.value

    # Verify DB
    await db_session.refresh(tenant)

    assert tenant.status == TenantStatus.DELETED.value

@pytest.mark.asyncio
async def test_delete_tenant_unauthorized(async_client: AsyncClient, db_session: AsyncSession):
    response = await async_client.delete("/api/v1/tenants")
    assert response.status_code == 401
