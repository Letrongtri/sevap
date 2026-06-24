import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Department, Tenants

async def get_test_tenant_id(db_session: AsyncSession) -> str:
    res = await db_session.execute(select(Tenants).limit(1))
    tenant = res.scalars().first()
    return str(tenant.id)

@pytest.fixture
async def custom_department(db_session: AsyncSession) -> Department:
    tenant_id = await get_test_tenant_id(db_session)
    dept = Department(
        tenant_id=tenant_id,
        name="Engineering",
        code="ENG",
        description="Software Development Department"
    )
    db_session.add(dept)
    await db_session.commit()
    return dept

@pytest.mark.asyncio
async def test_get_all_departments(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/departments", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(dept["code"] == "ENG" for dept in data)

@pytest.mark.asyncio
async def test_get_all_simple_departments(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/departments/simple", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(dept["code"] == "ENG" for dept in data)
    assert "name" in data[0]
    assert "id" in data[0]

@pytest.mark.asyncio
async def test_create_department_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    dept_data = {
        "name": "Human Resources",
        "code": "HRD",
        "description": "HR and Recruitment"
    }
    
    response = await async_client.post("/api/v1/departments", json=dept_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Human Resources"
    assert data["code"] == "HRD"
    assert "id" in data
    assert "tenant_id" in data

@pytest.mark.asyncio
async def test_create_department_already_exists(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    dept_data = {
        "name": "Engineering New",
        "code": "ENG",  # Duplicate code
        "description": "Another engineering dept"
    }
    
    response = await async_client.post("/api/v1/departments", json=dept_data, headers=headers)
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_get_department_detail_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/departments/{custom_department.id}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == str(custom_department.id)
    assert data["name"] == "Engineering"

@pytest.mark.asyncio
async def test_get_department_detail_not_found(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/departments/019edb5f-41d7-7a81-86c0-55c1677d5edc", headers=headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_department_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    update_data = {
        "name": "Engineering Refactored",
        "description": "Updated description"
    }
    
    response = await async_client.patch(f"/api/v1/departments/{custom_department.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Engineering Refactored"
    assert data["description"] == "Updated description"

@pytest.mark.asyncio
async def test_delete_department_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_department):
    headers = await admin_headers()
    response = await async_client.delete(f"/api/v1/departments/{custom_department.id}", headers=headers)
    assert response.status_code == 200
    
    # Verify soft delete
    await db_session.refresh(custom_department)
    assert custom_department.is_deleted is True


@pytest.mark.asyncio
async def test_unauthorized_department_management(async_client: AsyncClient, db_session: AsyncSession, employee_headers, custom_department):
    # Standard employee should get 403 Forbidden on create, update, delete departments
    headers = await employee_headers()
    
    # 1. Try to create department
    dept_data = {
        "name": "hacker_dept",
        "code": "HACK",
        "description": "Unauthorized creation attempt"
    }
    res_create = await async_client.post("/api/v1/departments", json=dept_data, headers=headers)
    assert res_create.status_code == 403
    
    # 2. Try to update department
    update_data = {
        "description": "Hacked description"
    }
    res_update = await async_client.patch(f"/api/v1/departments/{custom_department.id}", json=update_data, headers=headers)
    assert res_update.status_code == 403
    
    # 3. Try to delete department
    res_delete = await async_client.delete(f"/api/v1/departments/{custom_department.id}", headers=headers)
    assert res_delete.status_code == 403

