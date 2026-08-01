import os
import socket
from sqlalchemy.engine import make_url

# 1. Early environment resolution of DATABASE_URL host
def resolve_db_host(url_str: str) -> str:
    url = make_url(url_str)
    host = url.host
    if host == "db":
        if os.name == 'nt' or not os.path.exists('/.dockerenv'):
            url = url._replace(host="localhost")
        else:
            try:
                socket.gethostbyname("db")
            except socket.gaierror:
                url = url._replace(host="localhost")
    return url.render_as_string(hide_password=False)

orig_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/hr_assistant")
resolved_url = resolve_db_host(orig_url)

# Construct test database URLs
parsed_url = make_url(resolved_url)
TEST_DB_NAME = f"{parsed_url.database}_test"
TEST_DATABASE_URL = parsed_url._replace(database=TEST_DB_NAME).render_as_string(hide_password=False)
POSTGRES_DATABASE_URL = parsed_url._replace(database="postgres").render_as_string(hide_password=False)

# Force settings to use the TEST database URL
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# Now import the settings and other packages
import asyncio
import pytest
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager
from httpx import AsyncClient, ASGITransport

from app.core.config import settings
from app.db.base_class import Base
from app.db.init_db import add_system_default_data
from app.main import app
from app.utils.auth import create_access_token
# Import all models to ensure they register on Base.metadata
from app.models import *

# 2. Disable application lifespan for testing to avoid database seed / lock on production db
@asynccontextmanager
async def dummy_lifespan(app_instance):
    yield

app.router.lifespan_context = dummy_lifespan

# Create session-scoped event loop override
@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# Session-scoped test engine
@pytest.fixture(scope="session")
def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    yield engine
    # Clean up engine connection pool
    asyncio.run(engine.dispose())

# Function-scoped database setup for clean database per test
@pytest.fixture(autouse=True)
async def clean_db_setup(event_loop):
    # 1. Connect to default 'postgres' database to create test database if not exists
    postgres_engine = create_async_engine(POSTGRES_DATABASE_URL, isolation_level="AUTOCOMMIT")
    async with postgres_engine.connect() as conn:
        exists = await conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{TEST_DB_NAME}'"))
        if not exists.scalar():
            await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    await postgres_engine.dispose()

    # 2. Recreate schema and seed default data
    test_engine = create_async_engine(TEST_DATABASE_URL)
    async with test_engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
        await conn.run_sync(Base.metadata.drop_all)

    # Run migrations via alembic subprocess to avoid event loop conflicts
    import subprocess
    import sys
    
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        env=env,
        capture_output=True,
        text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    if result.returncode != 0:
        raise RuntimeError(f"Alembic migration failed: {result.stderr}\nOutput: {result.stdout}")

    # Seed default data (Tenant, roles, permissions, admin user)
    AsyncSessionLocal = sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with AsyncSessionLocal() as db:
        await add_system_default_data(db)
        
        # Seed default test tenant 'system.sevap.com'
        from app.repositories import TenantRepository, PermissionRepository
        from app.services import TenantService
        from app.schemas import TenantCreate
        
        tenant_repo = TenantRepository(db)
        perm_repo = PermissionRepository(db)
        tenant_service = TenantService(tenant_repo, perm_repo)
        
        tenant_data = TenantCreate(
            tenant_domain="system.sevap.com",
            company_name="System Default Co",
            company_description="Default System Tenant",
            company_email="info@system.sevap.com",
            company_phone="0912345678",
            company_address="123 System St",
            admin_employee_code="admin",
            admin_full_name="System Administrator",
            admin_email="admin@company.local",
            admin_password="Admin@1234"
        )
        await tenant_service.register_tenant(tenant_data)

    await test_engine.dispose()

@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provides a fresh db session for the test code."""
    AsyncSessionLocal = sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with AsyncSessionLocal() as session:
        yield session

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async Client using ASGITransport to bypass networking stack."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as ac:
        yield ac

@pytest.fixture
def admin_headers(db_session) -> dict:
    """Generate auth headers for system default tenant administrator."""
    async def _get_headers():
        from app.models import User, UserRole, Role, Tenants
        from sqlalchemy.future import select
        from sqlalchemy.orm import selectinload
        
        # 1. Fetch tenant system.sevap.com
        res_tenant = await db_session.execute(select(Tenants).filter_by(tenant_domain="system.sevap.com"))
        tenant = res_tenant.scalars().first()
        if not tenant:
            raise ValueError("Default tenant system.sevap.com not found")
            
        # 2. Fetch admin user of this tenant
        stmt = select(User).filter_by(
            employee_code="admin",
            tenant_id=tenant.id
        ).options(
            selectinload(User.role_associations)
            .selectinload(UserRole.role)
            .selectinload(Role.permissions)
        )
        res = await db_session.execute(stmt)
        admin = res.scalars().first()
        if not admin:
            raise ValueError("Tenant admin user not found in test db")
            
        user_roles = []
        user_permissions = []
        for role_assoc in admin.role_associations:
            r = role_assoc.role
            user_roles.append(r.name)
            for perm in r.permissions:
                user_permissions.append(f"{perm.resource}:{perm.action}")
                
        token = create_access_token(
            user_id=str(admin.id),
            user_roles=user_roles,
            tenant_id=str(tenant.id),
            is_global_admin=False,
            permissions=user_permissions
        )
        return {"Authorization": f"Bearer {token.token}"}
        
    return _get_headers

@pytest.fixture
def global_admin_headers(db_session) -> dict:
    """Generate auth headers for system-wide Global Administrator."""
    async def _get_headers():
        from app.models import User, UserRole, Role
        from sqlalchemy.future import select
        from sqlalchemy.orm import selectinload
        
        stmt = select(User).filter_by(
            employee_code="admin",
            tenant_id=None
        ).options(
            selectinload(User.role_associations)
            .selectinload(UserRole.role)
            .selectinload(Role.permissions)
        )
        res = await db_session.execute(stmt)
        admin = res.scalars().first()
        if not admin:
            raise ValueError("Global admin user not found in test db")
            
        user_roles = []
        user_permissions = []
        for role_assoc in admin.role_associations:
            r = role_assoc.role
            user_roles.append(r.name)
            for perm in r.permissions:
                user_permissions.append(f"{perm.resource}:{perm.action}")
                
        token = create_access_token(
            user_id=str(admin.id),
            user_roles=user_roles,
            tenant_id=None,
            is_global_admin=True,
            permissions=user_permissions
        )
        return {"Authorization": f"Bearer {token.token}"}
        
    return _get_headers


@pytest.fixture
def employee_headers(db_session) -> dict:
    """Generate auth headers for a standard tenant employee."""
    async def _get_headers():
        from app.models import Tenants
        from sqlalchemy.future import select
        from app.utils.auth import create_access_token
        
        # 1. Fetch tenant system.sevap.com
        res_tenant = await db_session.execute(select(Tenants).filter_by(tenant_domain="system.sevap.com"))
        tenant = res_tenant.scalars().first()
        if not tenant:
            raise ValueError("Default tenant system.sevap.com not found")
            
        token = create_access_token(
            user_id="employee-test-id",
            user_roles=["employee"],
            tenant_id=str(tenant.id),
            is_global_admin=False,
            permissions=[
                "users:read",
                "roles:read",
                "job_titles:read",
                "departments:read",
                "documents:read",
                "conversations:create",
                "conversations:read",
                "conversations:update",
                "conversations:delete",
                "conversations:send"
            ]
        )
        return {"Authorization": f"Bearer {token.token}"}
        
    return _get_headers

