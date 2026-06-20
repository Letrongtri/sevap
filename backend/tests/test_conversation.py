import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Conversation, Message, Tenants, User
from app.ai_brain.retrieval.schemas import PARContext

async def mock_route_stream(*args, **kwargs):
    yield {"type": "token", "data": "Hello"}
    yield {"type": "token", "data": " world!"}
    yield {"type": "done", "agent_type": "hr_policy", "sources": [{"doc_title": "HR Policy", "score": 0.95}]}

@pytest.fixture(autouse=True)
def mock_ai_brain():
    """Mock the expensive LLM routing and PAR context builder."""
    with patch("app.ai_brain.retrieval.repository.PARRepository.build_par_context", new_callable=AsyncMock) as mock_par, \
         patch("app.ai_brain.router.intent_router.IntentRouter.route_stream", side_effect=mock_route_stream) as mock_route:
        mock_par.return_value = PARContext(
            user_id="dummy-user-id",
            tenant_id="dummy-tenant-id",
            role_ids=[],
            role_access_level="public",
            department_ids=[],
            is_admin=False
        )
        yield mock_par, mock_route

async def get_test_tenant(db_session: AsyncSession) -> Tenants:
    res = await db_session.execute(select(Tenants).limit(1))
    return res.scalar_one()

@pytest.fixture
async def seeded_conversation(db_session: AsyncSession) -> Conversation:
    tenant = await get_test_tenant(db_session)
    res_user = await db_session.execute(select(User).filter_by(employee_code="admin"))
    admin = res_user.scalar_one()

    conv = Conversation(
        tenant_id=tenant.id,
        user_id=admin.id,
        title="Seeded Chat Session",
        is_deleted=False
    )
    db_session.add(conv)
    await db_session.commit()
    await db_session.refresh(conv)
    return conv

@pytest.fixture
async def seeded_message(db_session: AsyncSession, seeded_conversation: Conversation) -> Message:
    msg = Message(
        conversation_id=seeded_conversation.id,
        actor="user",
        content="Test User Message"
    )
    db_session.add(msg)
    await db_session.commit()
    await db_session.refresh(msg)
    return msg

@pytest.mark.asyncio
async def test_get_all_personal_conversations(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation):
    headers = await admin_headers()
    response = await async_client.get("/api/v1/conversations", headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert "conversations" in resp_data
    assert "pagination" in resp_data
    assert len(resp_data["conversations"]) > 0
    assert any(c["id"] == seeded_conversation.id for c in resp_data["conversations"])

@pytest.mark.asyncio
async def test_send_message_create_conversation(async_client: AsyncClient, db_session: AsyncSession, admin_headers):
    headers = await admin_headers()
    
    message_payload = {
        "content": "Hello AI, tell me about the company leave policy"
    }
    
    response = await async_client.post("/api/v1/conversations/message", json=message_payload, headers=headers)
    assert response.status_code == 200
    
    # Read streamed SSE content
    body = await response.aread()
    body_text = body.decode("utf-8")
    
    assert "event: metadata" in body_text
    assert "event: token" in body_text
    assert "event: done" in body_text
    
    # Verify a new conversation was created in DB
    res_db = await db_session.execute(
        select(Conversation).where(
            Conversation.title.like("Hello AI%")
        )
    )
    conv = res_db.scalars().first()
    assert conv is not None

@pytest.mark.asyncio
async def test_send_message_existing_conversation(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation):
    headers = await admin_headers()
    conv_id = str(seeded_conversation.id)
    
    message_payload = {
        "conversation_id": conv_id,
        "content": "Follow up question about leaves"
    }
    
    response = await async_client.post("/api/v1/conversations/message", json=message_payload, headers=headers)
    assert response.status_code == 200
    
    body = await response.aread()
    body_text = body.decode("utf-8")
    
    assert "event: metadata" in body_text
    assert "event: token" in body_text
    assert "event: done" in body_text
    
    # Verify that the message was added to the existing conversation
    res_msg = await db_session.execute(
        select(Message).filter_by(conversation_id=conv_id, actor="user", content="Follow up question about leaves")
    )
    msg = res_msg.scalars().first()
    assert msg is not None

@pytest.mark.asyncio
async def test_get_conversation_detail(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation, seeded_message):
    headers = await admin_headers()
    conv_id = str(seeded_conversation.id)
    
    response = await async_client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["id"] == conv_id
    assert resp_data["title"] == seeded_conversation.title
    assert "messages" in resp_data
    assert len(resp_data["messages"]) > 0
    assert resp_data["messages"][0]["content"] == "Test User Message"

@pytest.mark.asyncio
async def test_update_conversation_title(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation):
    headers = await admin_headers()
    conv_id = str(seeded_conversation.id)
    
    update_data = {
        "title": "Renamed Chat Session"
    }
    
    response = await async_client.patch(f"/api/v1/conversations/{conv_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["title"] == "Renamed Chat Session"
    
    # Verify in DB
    db_session.expire_all()
    res_db = await db_session.execute(select(Conversation).filter_by(id=conv_id))
    conv = res_db.scalar_one()
    assert conv.title == "Renamed Chat Session"

@pytest.mark.asyncio
async def test_delete_conversation(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation):
    headers = await admin_headers()
    conv_id = str(seeded_conversation.id)
    
    response = await async_client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert response.status_code == 200
    
    # Verify soft deletion in database
    db_session.expire_all()
    res_db = await db_session.execute(select(Conversation).filter_by(id=conv_id))
    conv = res_db.scalar_one()
    assert conv.is_deleted is True

@pytest.mark.asyncio
async def test_get_messages_by_conversation_id(async_client: AsyncClient, db_session: AsyncSession, admin_headers, seeded_conversation, seeded_message):
    headers = await admin_headers()
    conv_id = str(seeded_conversation.id)
    
    response = await async_client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert isinstance(resp_data, list)
    assert len(resp_data) > 0
    assert resp_data[0]["content"] == "Test User Message"
