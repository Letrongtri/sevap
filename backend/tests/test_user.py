import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import User, Role, Department, JobTitle
from app.core.config import settings
from app.utils.auth import hash_password

@pytest.mark.asyncio
async def test_get_all_users(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/users", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "users" in data
    assert "pagination" in data
    assert len(data["users"]) > 0
    # The first user returned should be the seeded admin
    admin_user = next((u for u in data["users"] if u["employee_code"] == "admin"), None)
    assert admin_user is not None
    assert admin_user["email"] == "admin@company.local"

@pytest.mark.asyncio
async def test_get_user_options(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/users/options", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "users" in data
    assert len(data["users"]) > 0
    assert "employee_code" in data["users"][0]
    assert "full_name" in data["users"][0]

@pytest.mark.asyncio
async def test_create_user_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    from app.models import Tenants
    res_tenant = await db_session.execute(select(Tenants).limit(1))
    tenant = res_tenant.scalar_one()

    # Create Department and JobTitle
    dept = Department(name="HR", code="HRD", description="HR Department", tenant_id=tenant.id)
    job = JobTitle(title_name="HR Manager", code="HRM", description="Manager of HR", tenant_id=tenant.id)
    db_session.add_all([dept, job])
    await db_session.commit()

    # Fetch seeded Role
    res_role = await db_session.execute(select(Role).limit(1))
    role = res_role.scalar_one()

    headers = await admin_headers()
    user_data = {
        "employee_code": "new_emp_001",
        "full_name": "New Employee",
        "password": "SecurePassword@123",
        "email": "new_emp@system.local",
        "job_title_id": job.id,
        "department_id": dept.id,
        "role_ids": [role.id]
    }
    
    response = await async_client.post("/api/v1/users", json=user_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["employee_code"] == "new_emp_001"
    assert data["full_name"] == "New Employee"
    assert data["email"] == "new_emp@system.local"
    assert data["department_id"] == dept.id
    assert data["job_title_id"] == job.id
    assert len(data["roles"]) == 1
    assert data["roles"][0]["id"] == role.id
    
    # Verify in DB
    res_db = await db_session.execute(select(User).filter_by(employee_code="new_emp_001"))
    db_user = res_db.scalars().first()
    assert db_user is not None
    assert db_user.full_name == "New Employee"

@pytest.mark.asyncio
async def test_create_user_already_exists(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Try to create a user with 'admin' employee code (already exists)
    headers = await admin_headers()
    user_data = {
        "employee_code": "admin",
        "full_name": "Another Admin",
        "password": "SecurePassword@123",
        "email": "another_admin@system.local",
    }
    
    response = await async_client.post("/api/v1/users", json=user_data, headers=headers)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_user_detail_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/users/{admin_user.id}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == admin_user.id
    assert data["employee_code"] == "admin"

@pytest.mark.asyncio
async def test_get_user_detail_not_found(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await async_client.get(f"/api/v1/users/{nonexistent_id}", headers=headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_update_user_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    update_data = {
        "full_name": "Updated Admin Name",
        "email": "updated_admin@system.local"
    }
    
    response = await async_client.put(f"/api/v1/users/{admin_user.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["full_name"] == "Updated Admin Name"
    assert data["email"] == "updated_admin@system.local"

@pytest.mark.asyncio
async def test_activate_deactivate_user(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    
    # Deactivate
    response = await async_client.patch(f"/api/v1/users/{admin_user.id}/deactivate", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    
    # Activate
    response = await async_client.patch(f"/api/v1/users/{admin_user.id}/activate", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is True

@pytest.mark.asyncio
async def test_reset_user_password(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    response = await async_client.patch(f"/api/v1/users/{admin_user.id}/reset-password", headers=headers)
    assert response.status_code == 200
    
    # Verify in DB (password hash changed)
    await db_session.refresh(admin_user)
    from app.utils.auth import verify_password
    assert verify_password(settings.DEFAULT_USER_PASSWORD, admin_user.password) is True

@pytest.mark.asyncio
async def test_change_user_password_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    # First reset to a strong password to know the exact password and pass Pydantic strength checks
    admin_user.password = hash_password("SecurePassword@123")
    await db_session.commit()
    
    headers = await admin_headers()
    change_data = {
        "old_password": "SecurePassword@123",
        "new_password": "NewSecurePassword@999"
    }
    
    response = await async_client.patch("/api/v1/users/change-password", json=change_data, headers=headers)
    assert response.status_code == 200
    
    # Verify new password is correct
    res_db_ref = await db_session.execute(select(User.password).filter_by(id=admin_user.id))
    pwd_hash = res_db_ref.scalar()
    from app.utils.auth import verify_password
    assert verify_password("NewSecurePassword@999", pwd_hash) is True

@pytest.mark.asyncio
async def test_change_user_password_invalid_old(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    change_data = {
        "old_password": "TotallyWrongPassword@123",
        "new_password": "NewSecurePassword@999"
    }
    
    response = await async_client.patch("/api/v1/users/change-password", json=change_data, headers=headers)
    assert response.status_code == 404
    assert "invalid password" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_update_my_profile_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch seeded admin user
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    headers = await admin_headers()
    update_data = {
        "full_name": "My New Profile Name",
        "email": "my_new_email@system.local"
    }
    
    response = await async_client.patch("/api/v1/users", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["full_name"] == "My New Profile Name"
    assert data["email"] == "my_new_email@system.local"
    
    # Verify in DB
    await db_session.refresh(admin_user)
    assert admin_user.full_name == "My New Profile Name"
    assert admin_user.email == "my_new_email@system.local"

@pytest.mark.asyncio
async def test_update_my_profile_email_already_exists(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Create another user in the same tenant to conflict email with
    from app.models import Tenants
    res_tenant = await db_session.execute(select(Tenants).limit(1))
    tenant = res_tenant.scalar_one()
    
    conflict_user = User(
        employee_code="conflict_user_emp",
        full_name="Conflict User",
        email="conflict_email@system.local",
        password=hash_password("SecurePassword@123"),
        tenant_id=tenant.id,
    )
    db_session.add(conflict_user)
    await db_session.commit()
    
    headers = await admin_headers()
    update_data = {
        "full_name": "Should Fail",
        "email": "conflict_email@system.local"
    }
    
    response = await async_client.patch("/api/v1/users", json=update_data, headers=headers)
    assert response.status_code == 409
    assert "user already exists" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_delete_user_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Create a user to delete
    from app.models import Tenants
    res_tenant = await db_session.execute(select(Tenants).limit(1))
    tenant = res_tenant.scalar_one()
    
    user_to_delete = User(
        employee_code="temp_del_user",
        full_name="Temporary User",
        email="temp_del@system.local",
        password=hash_password("SecurePassword@123"),
        tenant_id=tenant.id,
    )
    db_session.add(user_to_delete)
    await db_session.commit()
    
    user_id = user_to_delete.id
    headers = await admin_headers()
    response = await async_client.delete(f"/api/v1/users/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_deleted"] is True
    
    # Verify in DB
    db_session.expire_all()
    res_db_ref = await db_session.execute(select(User).filter_by(id=user_id))
    db_user = res_db_ref.scalar_one()
    assert db_user.is_deleted is True


@pytest.mark.asyncio
async def test_unauthorized_user_management(async_client: AsyncClient, db_session: AsyncSession, employee_headers):
    # Standard employee should get 403 Forbidden on create, update, delete users
    headers = await employee_headers()
    
    # 1. Try to create user
    create_data = {
        "employee_code": "unauth_emp",
        "full_name": "Unauthorized User",
        "email": "unauth@system.local",
        "password": "SecurePassword@123",
        "role_ids": []
    }
    res_create = await async_client.post("/api/v1/users", json=create_data, headers=headers)
    assert res_create.status_code == 403
    
    # Fetch seeded admin to try updating/deleting
    res_db = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id.isnot(None)))
    admin_user = res_db.scalar_one()
    
    # 2. Try to update user
    update_data = {
        "full_name": "Hack Name"
    }
    res_update = await async_client.put(f"/api/v1/users/{admin_user.id}", json=update_data, headers=headers)
    assert res_update.status_code == 403
    
    # 3. Try to delete user
    res_delete = await async_client.delete(f"/api/v1/users/{admin_user.id}", headers=headers)
    assert res_delete.status_code == 403

