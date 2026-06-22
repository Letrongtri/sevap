import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import User, UserSession
from app.utils.auth import create_refresh_token

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, db_session: AsyncSession):
    # System default data contains tenant system.hrnexus.com, employee_code admin, password Admin@1234
    login_data = {
        "tenant_domain": "system.hrnexus.com",
        "employee_code": "admin",
        "password": "Admin@1234"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["employee_code"] == "admin"
    assert data["user"]["tenant_domain"] == "system.hrnexus.com"

@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient, db_session: AsyncSession):
    login_data = {
        "tenant_domain": "system.hrnexus.com",
        "employee_code": "admin",
        "password": "WrongPassword@123"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect credentials"
    
    # Verify login failure is logged
    from app.models import ActivityLog
    import asyncio
    # Allow background asyncio.create_task to execute
    await asyncio.sleep(0.1)
    
    # We open a clean session to see the background inserts
    db_session.expire_all()
    res = await db_session.execute(select(ActivityLog).filter_by(action="user.login_failed"))
    log = res.scalars().first()
    assert log is not None
    assert log.log_level == "WARNING"
    assert log.meta_data["employee_code"] == "admin"

@pytest.mark.asyncio
async def test_login_invalid_tenant(async_client: AsyncClient, db_session: AsyncSession):
    login_data = {
        "tenant_domain": "nonexistent.local",
        "employee_code": "admin",
        "password": "Admin@1234"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_login_validation_error(async_client: AsyncClient, db_session: AsyncSession):
    # Password must satisfy complexity strength validator
    # E.g. "short" doesn't satisfy strength validation
    login_data = {
        "tenant_domain": "system.hrnexus.com",
        "employee_code": "admin",
        "password": "123"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 422
    assert "validation error" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_refresh_token_success(async_client: AsyncClient, db_session: AsyncSession):
    # Fetch admin user
    res = await db_session.execute(select(User).filter_by(employee_code="admin"))
    admin = res.scalars().first()
    assert admin is not None
    
    # Generate a refresh token and create a session
    refresh_token = create_refresh_token(str(admin.id))
    
    session = UserSession(
        user_id=admin.id,
        tenant_id=admin.tenant_id,
        jti=refresh_token.jti,
        expires_at=refresh_token.expires_at
    )
    db_session.add(session)
    await db_session.commit()
    
    refresh_data = {
        "tenant_domain": "system.hrnexus.com",
        "refresh_token": refresh_token.token
    }
    response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_refresh_token_invalid(async_client: AsyncClient, db_session: AsyncSession):
    refresh_data = {
        "tenant_domain": "system.hrnexus.com",
        "refresh_token": "invalid.refresh.token"
    }
    response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
    # The validation inside verify_token raises ValueError for invalid JWT format,
    # which leads to 422 or 401 error.
    assert response.status_code in [401, 422]

@pytest.mark.asyncio
async def test_logout_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    # Fetch admin user
    res = await db_session.execute(select(User).filter_by(employee_code="admin"))
    admin = res.scalars().first()
    
    # Create refresh token and session
    refresh_token = create_refresh_token(str(admin.id))
    session = UserSession(
        user_id=admin.id,
        tenant_id=admin.tenant_id,
        jti=refresh_token.jti,
        expires_at=refresh_token.expires_at
    )
    db_session.add(session)
    await db_session.commit()
    
    headers = await admin_headers()
    logout_data = {
        "tenant_domain": "system.hrnexus.com",
        "refresh_token": refresh_token.token
    }
    response = await async_client.post("/api/v1/auth/logout", json=logout_data, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"message": "Logout successful"}
    
    # Verify session is revoked
    await db_session.refresh(session)
    assert session.revoked_at is not None

@pytest.mark.asyncio
async def test_get_current_user_me(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["employee_code"] == "admin"
    assert data["email"] == "admin@company.local"

@pytest.mark.asyncio
async def test_get_current_user_me_unauthorized(async_client: AsyncClient, db_session: AsyncSession):
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401
