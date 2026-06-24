import pytest
import os
import tempfile
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Document, Tenants, User, Department, Role
from app.core.enum import AccessLevel, DocumentStatus
from app.core.config import settings

@pytest.fixture(autouse=True)
def mock_document_chunking():
    """Mock document chunking background task to avoid executing expensive models during tests."""
    with patch("app.services.document_service.DocumentService._process_document_chunking", new_callable=AsyncMock) as mock:
        yield mock

async def get_test_tenant(db_session: AsyncSession) -> Tenants:
    res = await db_session.execute(select(Tenants).limit(1))
    return res.scalar_one()

@pytest.fixture
async def seeded_document(db_session: AsyncSession) -> Document:
    tenant = await get_test_tenant(db_session)
    res_user = await db_session.execute(select(User).where(User.employee_code == "admin", User.tenant_id == tenant.id))
    admin = res_user.scalar_one()
    
    # Create dummy file on disk
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, "test_doc_seeded.docx")
    with open(file_path, "wb") as f:
        f.write(b"Seeded doc content")
        
    doc = Document(
        tenant_id=tenant.id,
        uploader_id=admin.id,
        title="Seeded Policy Document",
        access_level=AccessLevel.PUBLIC.value,
        file_name="test_doc_seeded.docx",
        file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_path=file_path,
        file_size=18,
        status=DocumentStatus.DONE.value,
        file_hash="dummy_seeded_hash",
        is_deleted=False
    )
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)
    return doc

@pytest.mark.asyncio
async def test_upload_document_success(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    
    # Create multipart file payload
    files = {
        "file": ("test_upload.docx", b"This is the docx file content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    }
    data = {
        "access_level": AccessLevel.PUBLIC.value,
        "title": "Uploaded Document Title",
        "category": "HR Guidelines"
    }
    
    response = await async_client.post("/api/v1/documents", files=files, data=data, headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["title"] == "Uploaded Document Title"
    assert resp_data["access_level"] == AccessLevel.PUBLIC.value
    assert resp_data["category"] == "HR Guidelines"
    assert "id" in resp_data
    
    # Verify in database
    doc_id = resp_data["id"]
    res_db = await db_session.execute(select(Document).filter_by(id=doc_id))
    doc = res_db.scalars().first()
    assert doc is not None
    assert doc.title == "Uploaded Document Title"
    assert doc.is_deleted is False

@pytest.mark.asyncio
async def test_upload_document_invalid_extension(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    
    files = {
        "file": ("test_upload.txt", b"Plain text content", "text/plain")
    }
    data = {
        "access_level": AccessLevel.PUBLIC.value,
        "title": "Invalid Document"
    }
    
    response = await async_client.post("/api/v1/documents", files=files, data=data, headers=headers)
    assert response.status_code == 400
    assert "must be a docx file" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_all_documents(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_document):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/documents", headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert "documents" in resp_data
    assert "pagination" in resp_data
    assert len(resp_data["documents"]) > 0
    assert any(doc["id"] == seeded_document.id for doc in resp_data["documents"])

@pytest.mark.asyncio
async def test_get_document_detail(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_document):
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/documents/{seeded_document.id}", headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["id"] == seeded_document.id
    assert resp_data["title"] == seeded_document.title

@pytest.mark.asyncio
async def test_get_document_file(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_document):
    headers = await admin_headers()
    response = await async_client.get(f"/api/v1/documents/{seeded_document.id}/file", headers=headers)
    assert response.status_code == 200
    assert response.content == b"Seeded doc content"
    assert "content-disposition" in response.headers

@pytest.mark.asyncio
async def test_update_document(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_document):
    headers = await admin_headers()
    doc_id = str(seeded_document.id)
    update_data = {
        "title": "Updated Policy Document Name",
        "category": "Updated Category",
        "access_level": AccessLevel.PUBLIC.value
    }
    
    response = await async_client.put(f"/api/v1/documents/{doc_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["title"] == "Updated Policy Document Name"
    assert resp_data["category"] == "Updated Category"
    
    # Verify in DB
    db_session.expire_all()
    res_db = await db_session.execute(select(Document).filter_by(id=doc_id))
    doc = res_db.scalar_one()
    assert doc.title == "Updated Policy Document Name"

@pytest.mark.asyncio
async def test_delete_document(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_document):
    headers = await admin_headers()
    doc_id = str(seeded_document.id)
    
    response = await async_client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert response.status_code == 200
    
    # Verify soft deletion in database
    db_session.expire_all()
    res_db = await db_session.execute(select(Document).filter_by(id=doc_id))
    doc = res_db.scalar_one()
    assert doc.is_deleted is True


@pytest.mark.asyncio
async def test_unauthorized_document_management(async_client: AsyncClient, db_session: AsyncSession, employee_headers, seeded_document):
    # Standard employee should get 403 Forbidden on upload, update, delete documents
    headers = await employee_headers()
    
    # 1. Try to upload document
    files = {
        "file": ("test_upload.docx", b"Hacker content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    }
    data = {
        "access_level": AccessLevel.PUBLIC.value,
        "title": "Hack Document"
    }
    res_upload = await async_client.post("/api/v1/documents", files=files, data=data, headers=headers)
    assert res_upload.status_code == 403
    
    # 2. Try to update document
    update_data = {
        "title": "Hacked Title"
    }
    res_update = await async_client.put(f"/api/v1/documents/{seeded_document.id}", json=update_data, headers=headers)
    assert res_update.status_code == 403
    
    # 3. Try to delete document
    res_delete = await async_client.delete(f"/api/v1/documents/{seeded_document.id}", headers=headers)
    assert res_delete.status_code == 403

