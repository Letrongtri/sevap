import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import ActivityLog, Tenants, User
from app.utils.auth import create_access_token
import uuid_utils

@pytest.fixture
async def regular_user_headers(db_session: AsyncSession):
    # Create or fetch a regular tenant
    res_tenant = await db_session.execute(select(Tenants).filter_by(tenant_domain="system.hrnexus.com"))
    tenant = res_tenant.scalars().first()
    
    # Create a regular user
    user = User(
        id=str(uuid_utils.uuid7()),
        tenant_id=tenant.id,
        email="employee@system.hrnexus.com",
        full_name="Regular Employee",
        employee_code="emp_123",
        password="hashed_password"
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token(
        user_id=str(user.id),
        tenant_id=str(tenant.id),
        user_roles=["employee"]
    )
    return {"Authorization": f"Bearer {token.token}"}


@pytest.mark.asyncio
async def test_global_log_endpoints(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()

    # 1. Insert a global log
    global_log = ActivityLog(
        id=str(uuid_utils.uuid7()),
        user_id=None,
        tenant_id=None,
        action="global_admin.test_action",
        resource="system",
        meta_data={"test": "data"},
        log_level="INFO"
    )
    db_session.add(global_log)
    await db_session.commit()

    # 2. Get global logs list
    response = await async_client.get("/api/v1/global-admin/logs", headers=headers)
    assert response.status_code == 200, response.json()
    data = response.json()
    assert len(data["data"]) >= 1
    # Verify the global log is returned
    actions = [item["action"] for item in data["data"]]
    assert "global_admin.test_action" in actions

    # 3. Get detailed global log
    detail_resp = await async_client.get(f"/api/v1/global-admin/logs/{global_log.id}", headers=headers)
    assert detail_resp.status_code == 200, detail_resp.json()
    assert detail_resp.json()["id"] == global_log.id


@pytest.mark.asyncio
async def test_tenant_log_privacy_redaction(
    async_client: AsyncClient, 
    db_session: AsyncSession, 
    admin_headers
):
    headers = await admin_headers()
    
    # Fetch default tenant
    res_tenant = await db_session.execute(select(Tenants).filter_by(tenant_domain="system.hrnexus.com"))
    tenant = res_tenant.scalars().first()

    # Create one sensitive conversation log and one regular user log under this tenant
    conv_log = ActivityLog(
        id=str(uuid_utils.uuid7()),
        user_id=None,
        tenant_id=tenant.id,
        action="chat.message_sent",
        resource="conversation",
        meta_data={"conversation_id": "123", "secret_info": "dont show this"},
        log_level="INFO"
    )
    user_log = ActivityLog(
        id=str(uuid_utils.uuid7()),
        user_id=None,
        tenant_id=tenant.id,
        action="user.create",
        resource="user",
        meta_data={"username": "alice"},
        log_level="INFO"
    )
    db_session.add(conv_log)
    db_session.add(user_log)
    await db_session.commit()

    # Global Admin queries the tenant's logs
    response = await async_client.get(
        f"/api/v1/logs?tenant_id={tenant.id}", 
        headers=headers
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    
    # Check that metadata of conversation resource is redacted
    items = {item["id"]: item for item in data["data"]}
    assert conv_log.id in items
    assert user_log.id in items
    
    assert items[conv_log.id]["meta_data"] == {"warning": "Content redacted for privacy protection"}
    assert items[user_log.id]["meta_data"] == {"username": "alice"}

    # Attempting to fetch detail of conversation log as global admin should return 403 Forbidden
    detail_conv_resp = await async_client.get(
        f"/api/v1/logs/{conv_log.id}", 
        headers=headers
    )
    assert detail_conv_resp.status_code == 403
    assert "restricted" in detail_conv_resp.json()["detail"].lower()

    # Attempting to fetch detail of user log as global admin should return 200 OK
    detail_user_resp = await async_client.get(
        f"/api/v1/logs/{user_log.id}", 
        headers=headers
    )
    assert detail_user_resp.status_code == 200
    assert detail_user_resp.json()["meta_data"] == {"username": "alice"}


@pytest.mark.asyncio
async def test_non_global_admin_denied(
    async_client: AsyncClient, 
    regular_user_headers
):
    # Regular users should be blocked from calling global logs endpoint
    response = await async_client.get(
        "/api/v1/global-admin/logs", 
        headers=regular_user_headers
    )
    assert response.status_code == 403
