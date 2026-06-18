import os
import socket
from sqlalchemy.engine import make_url

# 1. Early environment resolution of DATABASE_URL host
def resolve_db_host(url_str: str) -> str:
    url = make_url(url_str)
    host = url.host
    if host == "db":
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
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed default data (Tenant, roles, permissions, admin user)
    AsyncSessionLocal = sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with AsyncSessionLocal() as db:
        await add_system_default_data(db)

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
    """Generate auth headers for system default administrator."""
    async def _get_headers():
        # Query admin user
        from app.models import User
        from sqlalchemy.future import select
        res = await db_session.execute(select(User).filter_by(employee_code="admin"))
        admin = res.scalars().first()
        if not admin:
            raise ValueError("Admin user not found in test db")
            
        token = create_access_token(
            user_id=str(admin.id),
            tenant_id=str(admin.tenant_id),
            user_roles=["admin"]
        )
        return {"Authorization": f"Bearer {token.token}"}
        
    return _get_headers
