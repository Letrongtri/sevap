import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Role, Permission

@pytest.mark.asyncio
async def test_get_all_roles(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/roles", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "roles" in data
    assert "pagination" in data
    assert len(data["roles"]) > 0
    # Verify that roles belong to the admin's tenant
    for r in data["roles"]:
        assert r["tenant_id"] is not None

@pytest.mark.asyncio
async def test_get_all_simple_roles(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/roles/simple", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "id" in data[0]

@pytest.mark.asyncio
async def test_create_role_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch some permissions to map to the new role
    res = await db_session.execute(select(Permission).limit(2))
    permissions = res.scalars().all()
    permission_ids = [p.id for p in permissions]
    
    headers = await admin_headers()
    role_data = {
        "name": "custom_hr_officer",
        "description": "Custom role for HR department officer",
        "access_level": "private",
        "permissions": permission_ids
    }
    
    response = await async_client.post("/api/v1/roles", json=role_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "custom_hr_officer"
    assert data["is_system"] is False
    assert len(data["permissions"]) == len(permission_ids)
    
    # Verify in DB
    res_role = await db_session.execute(select(Role).filter_by(name="custom_hr_officer"))
    role = res_role.scalars().first()
    assert role is not None
    assert role.description == "Custom role for HR department officer"

@pytest.mark.asyncio
async def test_create_role_already_exists(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Try to create a role with name "admin" which already exists for this tenant
    headers = await admin_headers()
    role_data = {
        "name": "admin",
        "description": "Conflict description",
        "access_level": "managerial",
        "permissions": []
    }
    response = await async_client.post("/api/v1/roles", json=role_data, headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Role already exists"

@pytest.mark.asyncio
async def test_get_role_detail_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch admin role
    res = await db_session.execute(select(Role).filter_by(name="admin"))
    role = res.scalars().first()
    assert role is not None
    
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/roles/{role.id}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "admin"
    assert data["id"] == str(role.id)

@pytest.mark.asyncio
async def test_get_role_detail_not_found(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await async_client.get(f"/api/v1/roles/{nonexistent_id}", headers=headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_role_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch admin user and their tenant_id
    from app.models import User
    res_admin = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin = res_admin.scalars().first()
    
    # Create a custom role to update (since system roles cannot change names or be deleted)
    custom_role = Role(
        tenant_id=admin.tenant_id,
        name="temp_role",
        description="To be updated",
        access_level="public",
        is_system=False
    )
    db_session.add(custom_role)
    await db_session.commit()
    
    # Fetch some permissions
    res_perms = await db_session.execute(select(Permission).limit(1))
    perm = res_perms.scalars().first()
    
    headers = await admin_headers()
    update_data = {
        "name": "temp_role_updated",
        "description": "Updated description",
        "access_level": "private",
        "permissions": [perm.id] if perm else []
    }
    
    response = await async_client.patch(f"/api/v1/roles/{custom_role.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "temp_role_updated"
    assert data["description"] == "Updated description"
    assert data["access_level"] == "private"
    if perm:
        assert len(data["permissions"]) == 1
        assert data["permissions"][0]["id"] == perm.id

@pytest.mark.asyncio
async def test_delete_role_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    from app.models import User
    res_admin = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin = res_admin.scalars().first()
    
    # Create custom role to delete (cannot delete system roles)
    custom_role = Role(
        tenant_id=admin.tenant_id,
        name="role_to_delete",
        description="Will be deleted",
        access_level="public",
        is_system=False
    )
    db_session.add(custom_role)
    await db_session.commit()
    
    headers = await admin_headers()
    response = await async_client.delete(f"/api/v1/roles/{custom_role.id}", headers=headers)
    assert response.status_code == 200
    
    # Verify in DB (soft delete is used in repo)
    await db_session.refresh(custom_role)
    assert custom_role.is_deleted is True


@pytest.mark.asyncio
async def test_unauthorized_role_management(async_client: AsyncClient, db_session: AsyncSession, employee_headers):
    # Standard employee should get 403 Forbidden on create, update, delete roles
    headers = await employee_headers()
    
    # 1. Try to create role
    role_data = {
        "name": "hacker_role",
        "description": "Unauthorized creation attempt",
        "access_level": "public",
        "permissions": []
    }
    res_create = await async_client.post("/api/v1/roles", json=role_data, headers=headers)
    assert res_create.status_code == 403
    
    # Fetch admin role to try updating/deleting
    res_role = await db_session.execute(select(Role).filter_by(name="admin"))
    admin_role = res_role.scalars().first()
    assert admin_role is not None
    
    # 2. Try to update role
    update_data = {
        "description": "Hacked description"
    }
    res_update = await async_client.patch(f"/api/v1/roles/{admin_role.id}", json=update_data, headers=headers)
    assert res_update.status_code == 403
    
    # 3. Try to delete role
    res_delete = await async_client.delete(f"/api/v1/roles/{admin_role.id}", headers=headers)
    assert res_delete.status_code == 403

