import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import JobTitle, Tenants

async def get_test_tenant_id(db_session: AsyncSession) -> str:
    res = await db_session.execute(select(Tenants).limit(1))
    tenant = res.scalars().first()
    return str(tenant.id)

@pytest.fixture
async def custom_job_title(db_session: AsyncSession) -> JobTitle:
    tenant_id = await get_test_tenant_id(db_session)
    job = JobTitle(
        tenant_id=tenant_id,
        title_name="Software Engineer",
        code="SWE",
        description="Software Engineering Role"
    )
    db_session.add(job)
    await db_session.commit()
    return job

@pytest.mark.asyncio
async def test_get_all_job_titles(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/job_titles", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(job["code"] == "SWE" for job in data)

@pytest.mark.asyncio
async def test_get_all_simple_job_titles(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/job_titles/simple", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(job["code"] == "SWE" for job in data)
    assert "title_name" in data[0]
    assert "id" in data[0]

@pytest.mark.asyncio
async def test_create_job_title_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    job_data = {
        "title_name": "Product Manager",
        "code": "PM",
        "description": "Product Management Role"
    }
    
    response = await async_client.post("/api/v1/job_titles", json=job_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title_name"] == "Product Manager"
    assert data["code"] == "PM"
    assert "id" in data
    assert "tenant_id" in data

@pytest.mark.asyncio
async def test_create_job_title_already_exists(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    job_data = {
        "title_name": "Software Engineer New",
        "code": "SWE",  # Duplicate code
        "description": "Another engineering role"
    }
    
    response = await async_client.post("/api/v1/job_titles", json=job_data, headers=headers)
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_get_job_title_detail_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/job_titles/{custom_job_title.id}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == str(custom_job_title.id)
    assert data["title_name"] == "Software Engineer"

@pytest.mark.asyncio
async def test_get_job_title_detail_not_found(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/job_titles/019edb5f-41d7-7a81-86c0-55c1677d5edc", headers=headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_job_title_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    update_data = {
        "title_name": "Senior Software Engineer",
        "description": "Updated job description"
    }
    
    response = await async_client.patch(f"/api/v1/job_titles/{custom_job_title.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title_name"] == "Senior Software Engineer"
    assert data["description"] == "Updated job description"

@pytest.mark.asyncio
async def test_delete_job_title_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers, custom_job_title):
    headers = await admin_headers()
    response = await async_client.delete(f"/api/v1/job_titles/{custom_job_title.id}", headers=headers)
    assert response.status_code == 200
    
    # Verify soft delete
    await db_session.refresh(custom_job_title)
    assert custom_job_title.is_deleted is True


@pytest.mark.asyncio
async def test_unauthorized_job_title_management(async_client: AsyncClient, db_session: AsyncSession, employee_headers, custom_job_title):
    # Standard employee should get 403 Forbidden on create, update, delete job titles
    headers = await employee_headers()
    
    # 1. Try to create job title
    job_data = {
        "title_name": "hacker_job",
        "description": "Unauthorized creation attempt"
    }
    res_create = await async_client.post("/api/v1/job_titles", json=job_data, headers=headers)
    assert res_create.status_code == 403
    
    # 2. Try to update job title
    update_data = {
        "description": "Hacked description"
    }
    res_update = await async_client.patch(f"/api/v1/job_titles/{custom_job_title.id}", json=update_data, headers=headers)
    assert res_update.status_code == 403
    
    # 3. Try to delete job title
    res_delete = await async_client.delete(f"/api/v1/job_titles/{custom_job_title.id}", headers=headers)
    assert res_delete.status_code == 403

