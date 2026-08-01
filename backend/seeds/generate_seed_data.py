"""
Seed Data Script
================
Thêm dữ liệu mẫu vào các bảng:
  - departments
  - job_titles
  - roles
  - user_roles
  - prompt_templates
  - conversations
  - messages

Bảng BỎ QUA (đã tồn tại hoặc không cần seed):
  - tenants, users          → hard-code ID bên dưới
  - permissions             → bỏ qua
  - documents               → bỏ qua
  - document_chunks         → bỏ qua
  - vector_embeddings       → bỏ qua
  - activity_logs           → bỏ qua
  - user_sessions           → bỏ qua

Cách chạy:
  python -m tests.generate_seed_data

Biến môi trường (hoặc file .env):
  DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import uuid_utils
from dotenv import load_dotenv
from sqlalchemy import text

# Ensure backend root directory is in sys.path
TESTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TESTS_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.db.session import AsyncSessionLocal

load_dotenv()

# ---------------------------------------------------------------------------
# ⚙️  CẤU HÌNH – Thay bằng ID thực tế trong database
# ---------------------------------------------------------------------------
TENANT_ID      = "019fa6e1-01f9-7272-82d7-a9e19b28456a"
ADMIN_USER_ID  = "019fa6e1-01f9-7272-82d7-a9f520caff9d"
# ---------------------------------------------------------------------------

NOW = datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid_utils.uuid7())

# ---------------------------------------------------------------------------
# Seed definitions
# ---------------------------------------------------------------------------

DEPARTMENTS = [
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Công nghệ thông tin",
        "code": "IT",
        "description": "Phòng quản lý hạ tầng và phát triển phần mềm",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Nhân sự",
        "code": "HR",
        "description": "Phòng quản lý nguồn nhân lực và tuyển dụng",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Tài chính – Kế toán",
        "code": "FIN",
        "description": "Phòng quản lý tài chính, ngân sách và kế toán",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Vận hành",
        "code": "OPS",
        "description": "Phòng quản lý quy trình và vận hành kinh doanh",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Pháp lý",
        "code": "LEGAL",
        "description": "Phòng tư vấn pháp lý và tuân thủ quy định",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "name": "Kinh doanh",
        "code": "SALES",
        "description": "Phòng kinh doanh và phát triển khách hàng",
    },
]

JOB_TITLES = [
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Kỹ sư phần mềm",
        "code": "SE",
        "description": "Phát triển và bảo trì các ứng dụng phần mềm",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Trưởng nhóm kỹ thuật",
        "code": "TECH_LEAD",
        "description": "Dẫn dắt nhóm kỹ thuật và phân tích kiến trúc hệ thống",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Chuyên viên nhân sự",
        "code": "HR_SPEC",
        "description": "Tuyển dụng, đào tạo và quản lý hồ sơ nhân sự",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Chuyên viên tài chính",
        "code": "FIN_ANLT",
        "description": "Phân tích báo cáo tài chính và lập ngân sách",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Quản lý vận hành",
        "code": "OPS_MGR",
        "description": "Giám sát và tối ưu hóa quy trình vận hành",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Chuyên viên pháp lý",
        "code": "LEGAL_SPEC",
        "description": "Tư vấn và xử lý các vấn đề pháp lý",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Giám đốc bộ phận",
        "code": "DEPT_DIR",
        "description": "Lãnh đạo và định hướng chiến lược bộ phận",
    },
    {
        "id": new_id(),
        "tenant_id": TENANT_ID,
        "title_name": "Nhân viên kinh doanh",
        "code": "SALES_EXEC",
        "description": "Phát triển và duy trì quan hệ khách hàng",
    },
]

PROMPT_TEMPLATES = [
    {
        "id": new_id(),
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "name": "Trợ lý hỏi đáp văn bản",
        "agent_type": "qa_agent",
        "system_prompt": (
            "Bạn là trợ lý AI thông minh của công ty. "
            "Hãy trả lời câu hỏi của người dùng dựa trên các tài liệu nội bộ được cung cấp. "
            "Nếu không tìm thấy thông tin trong tài liệu, hãy trả lời 'Tôi không tìm thấy thông tin liên quan trong hệ thống.'. "
            "Luôn trả lời bằng tiếng Việt, ngắn gọn và rõ ràng."
        ),
        "user_prompt": "Dựa vào tài liệu sau:\n{context}\n\nHãy trả lời câu hỏi: {question}",
        "variables": "context,question",
        "is_active": True,
    },
    {
        "id": new_id(),
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "name": "Trợ lý hội thoại chung",
        "agent_type": "chat_agent",
        "system_prompt": (
            "Bạn là trợ lý AI của công ty, hỗ trợ nhân viên trong công việc hàng ngày. "
            "Hãy trả lời thân thiện, chuyên nghiệp và hữu ích. "
            "Khi cần tra cứu tài liệu nội bộ, hãy sử dụng công cụ tìm kiếm được cung cấp. "
            "Trả lời bằng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác."
        ),
        "user_prompt": "{message}",
        "variables": "message",
        "is_active": True,
    },
    {
        "id": new_id(),
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "name": "Tóm tắt tài liệu",
        "agent_type": "summarize_agent",
        "system_prompt": (
            "Bạn là chuyên gia tóm tắt tài liệu. "
            "Hãy đọc tài liệu được cung cấp và tóm tắt các ý chính một cách súc tích, "
            "có cấu trúc rõ ràng với các mục và điểm bullet. "
            "Luôn bắt đầu bằng một câu tóm lược tổng thể (executive summary)."
        ),
        "user_prompt": "Hãy tóm tắt tài liệu sau:\n\n{document_content}",
        "variables": "document_content",
        "is_active": True,
    },
    {
        "id": new_id(),
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "name": "Hỗ trợ soạn thảo văn bản",
        "agent_type": "writing_agent",
        "system_prompt": (
            "Bạn là trợ lý soạn thảo văn bản chuyên nghiệp. "
            "Hãy giúp người dùng viết, chỉnh sửa hoặc cải thiện các văn bản công việc "
            "như báo cáo, email, đề xuất dự án. "
            "Giữ văn phong chuyên nghiệp, lịch sự và phù hợp với ngữ cảnh doanh nghiệp."
        ),
        "user_prompt": "Yêu cầu: {request}\n\nNội dung cần xử lý (nếu có):\n{content}",
        "variables": "request,content",
        "is_active": False,  # Draft, chưa kích hoạt
    },
]

# Conversations và messages mẫu
CONV_1_ID = new_id()
CONV_2_ID = new_id()

CONVERSATIONS = [
    {
        "id": CONV_1_ID,
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "title": "Hướng dẫn sử dụng hệ thống",
        "is_deleted": False,
    },
    {
        "id": CONV_2_ID,
        "user_id": ADMIN_USER_ID,
        "tenant_id": TENANT_ID,
        "title": "Chính sách nhân sự công ty",
        "is_deleted": False,
    },
]

MESSAGES = [
    # --- Conversation 1 ---
    {
        "id": new_id(),
        "conversation_id": CONV_1_ID,
        "actor": "user",
        "agent_type": None,
        "content": "Hệ thống này có những chức năng gì?",
        "tool_calls": None,
        "confidence_score": None,
        "tool_results": None,
        "retrieval_context": None,
    },
    {
        "id": new_id(),
        "conversation_id": CONV_1_ID,
        "actor": "assistant",
        "agent_type": "chat_agent",
        "content": (
            "Hệ thống hỗ trợ các chức năng chính sau:\n"
            "1. **Quản lý tài liệu** – Upload, phân loại và phân quyền truy cập tài liệu nội bộ.\n"
            "2. **Tìm kiếm thông minh** – Tìm kiếm ngữ nghĩa dựa trên AI qua toàn bộ kho tài liệu.\n"
            "3. **Hỏi đáp tự động** – Đặt câu hỏi bằng ngôn ngữ tự nhiên, hệ thống trả lời dựa trên tài liệu.\n"
            "4. **Quản lý người dùng** – Quản lý nhân viên, phòng ban, chức danh và phân quyền theo vai trò.\n"
            "Bạn muốn tìm hiểu thêm về chức năng nào?"
        ),
        "tool_calls": None,
        "confidence_score": 0.95,
        "tool_results": None,
        "retrieval_context": None,
    },
    {
        "id": new_id(),
        "conversation_id": CONV_1_ID,
        "actor": "user",
        "agent_type": None,
        "content": "Làm thế nào để upload tài liệu mới?",
        "tool_calls": None,
        "confidence_score": None,
        "tool_results": None,
        "retrieval_context": None,
    },
    {
        "id": new_id(),
        "conversation_id": CONV_1_ID,
        "actor": "assistant",
        "agent_type": "chat_agent",
        "content": (
            "Để upload tài liệu mới, bạn thực hiện các bước sau:\n"
            "1. Vào menu **Tài liệu** → **Upload tài liệu**.\n"
            "2. Chọn file cần upload (hỗ trợ PDF, DOCX, TXT, ...).\n"
            "3. Điền tiêu đề, danh mục và chọn mức độ truy cập (công khai / phòng ban / cá nhân).\n"
            "4. Nhấn **Xác nhận** – hệ thống sẽ tự động xử lý và lập chỉ mục tài liệu.\n\n"
            "Sau khi xử lý xong, tài liệu sẽ có thể tìm kiếm được trong vòng vài phút."
        ),
        "tool_calls": None,
        "confidence_score": 0.92,
        "tool_results": None,
        "retrieval_context": None,
    },
    # --- Conversation 2 ---
    {
        "id": new_id(),
        "conversation_id": CONV_2_ID,
        "actor": "user",
        "agent_type": None,
        "content": "Chính sách nghỉ phép hàng năm của công ty là bao nhiêu ngày?",
        "tool_calls": None,
        "confidence_score": None,
        "tool_results": None,
        "retrieval_context": None,
    },
    {
        "id": new_id(),
        "conversation_id": CONV_2_ID,
        "actor": "assistant",
        "agent_type": "qa_agent",
        "content": (
            "Tôi không tìm thấy thông tin liên quan trong hệ thống. "
            "Vui lòng liên hệ phòng Nhân sự để được hỗ trợ hoặc upload tài liệu "
            "chính sách nhân sự để tôi có thể trả lời chính xác hơn."
        ),
        "tool_calls": None,
        "confidence_score": 0.30,
        "tool_results": None,
        "retrieval_context": None,
    },
]


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

async def upsert_departments(session, departments: list[dict]) -> int:
    if not departments:
        return 0
    stmt = text("""
        INSERT INTO departments (id, tenant_id, name, code, description, created_at, updated_at, is_deleted)
        VALUES (:id, :tenant_id, :name, :code, :description, :created_at, :updated_at, :is_deleted)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "id": d["id"],
            "tenant_id": d["tenant_id"],
            "name": d["name"],
            "code": d["code"],
            "description": d.get("description"),
            "created_at": NOW,
            "updated_at": NOW,
            "is_deleted": False,
        }
        for d in departments
    ]
    await session.execute(stmt, params)
    return len(departments)


async def upsert_job_titles(session, job_titles: list[dict]) -> int:
    if not job_titles:
        return 0
    stmt = text("""
        INSERT INTO job_titles (id, tenant_id, title_name, code, description, created_at, updated_at, is_deleted)
        VALUES (:id, :tenant_id, :title_name, :code, :description, :created_at, :updated_at, :is_deleted)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "id": jt["id"],
            "tenant_id": jt["tenant_id"],
            "title_name": jt["title_name"],
            "code": jt["code"],
            "description": jt.get("description"),
            "created_at": NOW,
            "updated_at": NOW,
            "is_deleted": False,
        }
        for jt in job_titles
    ]
    await session.execute(stmt, params)
    return len(job_titles)


async def upsert_user_roles(session, user_roles: list[dict]) -> int:
    if not user_roles:
        return 0
    stmt = text("""
        INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
        VALUES (:user_id, :role_id, :assigned_by, :assigned_at)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "user_id": ur["user_id"],
            "role_id": ur["role_id"],
            "assigned_by": ur["assigned_by"],
            "assigned_at": ur["assigned_at"],
        }
        for ur in user_roles
    ]
    await session.execute(stmt, params)
    return len(user_roles)


async def upsert_prompt_templates(session, templates: list[dict]) -> int:
    if not templates:
        return 0
    stmt = text("""
        INSERT INTO prompt_templates
            (id, user_id, tenant_id, name, agent_type, system_prompt, user_prompt, variables, is_active, created_at, updated_at)
        VALUES
            (:id, :user_id, :tenant_id, :name, :agent_type, :system_prompt, :user_prompt, :variables, :is_active, :created_at, :updated_at)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "id": t["id"],
            "user_id": t["user_id"],
            "tenant_id": t["tenant_id"],
            "name": t["name"],
            "agent_type": t["agent_type"],
            "system_prompt": t.get("system_prompt"),
            "user_prompt": t.get("user_prompt"),
            "variables": t.get("variables"),
            "is_active": t["is_active"],
            "created_at": NOW,
            "updated_at": NOW,
        }
        for t in templates
    ]
    await session.execute(stmt, params)
    return len(templates)


async def upsert_conversations(session, conversations: list[dict]) -> int:
    if not conversations:
        return 0
    stmt = text("""
        INSERT INTO conversations (id, user_id, tenant_id, title, is_deleted, created_at, updated_at)
        VALUES (:id, :user_id, :tenant_id, :title, :is_deleted, :created_at, :updated_at)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "id": c["id"],
            "user_id": c["user_id"],
            "tenant_id": c["tenant_id"],
            "title": c["title"],
            "is_deleted": c["is_deleted"],
            "created_at": NOW,
            "updated_at": NOW,
        }
        for c in conversations
    ]
    await session.execute(stmt, params)
    return len(conversations)


async def upsert_messages(session, messages: list[dict]) -> int:
    if not messages:
        return 0
    stmt = text("""
        INSERT INTO messages
            (id, conversation_id, actor, agent_type, content, tool_calls,
             confidence_score, tool_results, retrieval_context, created_at)
        VALUES
            (:id, :conversation_id, :actor, :agent_type, :content, :tool_calls,
             :confidence_score, :tool_results, :retrieval_context, :created_at)
        ON CONFLICT DO NOTHING
    """)
    params = [
        {
            "id": m["id"],
            "conversation_id": m["conversation_id"],
            "actor": m["actor"],
            "agent_type": m.get("agent_type"),
            "content": m["content"],
            "tool_calls": json.dumps(m["tool_calls"]) if m.get("tool_calls") is not None else None,
            "confidence_score": m.get("confidence_score"),
            "tool_results": json.dumps(m["tool_results"]) if m.get("tool_results") is not None else None,
            "retrieval_context": json.dumps(m["retrieval_context"]) if m.get("retrieval_context") is not None else None,
            "created_at": NOW,
        }
        for m in messages
    ]
    await session.execute(stmt, params)
    return len(messages)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def seed():
    print("=" * 60)
    print("  DATABASE SEED SCRIPT")
    print("=" * 60)
    print(f"  TENANT_ID    : {TENANT_ID}")
    print(f"  ADMIN_USER_ID: {ADMIN_USER_ID}")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        try:
            # 1. Departments
            n = await upsert_departments(session, DEPARTMENTS)
            print(f"[OK] departments      : {n} bản ghi")

            # 2. Job Titles
            n = await upsert_job_titles(session, JOB_TITLES)
            print(f"[OK] job_titles        : {n} bản ghi")

            # 3. Prompt Templates
            n = await upsert_prompt_templates(session, PROMPT_TEMPLATES)
            print(f"[OK] prompt_templates  : {n} bản ghi")

            # 4. Conversations
            n = await upsert_conversations(session, CONVERSATIONS)
            print(f"[OK] conversations     : {n} bản ghi")

            # 5. Messages
            n = await upsert_messages(session, MESSAGES)
            print(f"[OK] messages          : {n} bản ghi")

            await session.commit()

            print("=" * 60)
            print("  SEED HOÀN TẤT [DONE]")
            print("=" * 60)

        except Exception as exc:
            await session.rollback()
            print(f"\n[ERROR] LỖI: {exc}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())