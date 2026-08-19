# 🤖 SEVAP — Secure Enterprise Virtual Assistant Platform

> **SEVAP** — Nền tảng cho phép doanh nghiệp triển khai trợ lý ảo thông minh để hỏi đáp dựa trên tài liệu nội bộ của doanh nghiệp.

---

## 📋 Mục lục

- [Mô tả dự án](#-mô-tả-dự-án)
- [Tổng quan hệ thống](#-tổng-quan-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cách chạy dự án](#-cách-chạy-dự-án)

---

## 📖 Mô tả dự án

SEVAP là một nền tảng SaaS đa người thuê (multi-tenant) cho phép các doanh nghiệp triển khai trợ lý ảo nội bộ để hỗ trợ nhân viên tra cứu thông tin từ kho tài liệu nội bộ (quy chế, chính sách, hợp đồng, hướng dẫn...) thông qua giao diện chat tự nhiên.

**Các tính năng chính:**

- 💬 **Chat thông minh với RAG**: Nhân viên đặt câu hỏi bằng ngôn ngữ tự nhiên, hệ thống tự động tìm kiếm và tổng hợp câu trả lời từ tài liệu nội bộ.
- 🔐 **Phân quyền tài liệu linh hoạt**: Tài liệu có thể được đặt ở mức `public`, `internal`, hoặc `private` — chỉ những người dùng được cấp quyền mới truy cập được.
- 🏢 **Kiến trúc Multi-Tenant**: Mỗi doanh nghiệp (tenant) hoạt động hoàn toàn độc lập, dữ liệu được cô lập theo từng tổ chức.
- 🧠 **Pipeline RAG nâng cao**: Sử dụng LangGraph để xây dựng luồng xử lý: phân loại ý định → truy xuất → rerank → kiểm tra ngưỡng → viết lại câu hỏi → sinh câu trả lời.
- 📊 **Dashboard quản trị**: Giao diện quản trị cho cả Global Admin (quản lý toàn nền tảng) và Tenant Admin (quản lý từng tổ chức).
- 🔎 **Theo dõi hoạt động**: Ghi nhật ký toàn bộ hoạt động của người dùng và admin trong hệ thống.

---

## 🏗 Tổng quan hệ thống

### Kiến trúc Multi-Tenant

```
┌─────────────────────────────────────────────────────┐
│                   SEVAP Platform                    │
│                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌───────────┐  │
│  │  Tenant A   │   │  Tenant B   │   │ Tenant C  │  │
│  │ (Company A) │   │ (Company B) │   │(Company C)│  │
│  └─────────────┘   └─────────────┘   └───────────┘  │
│                                                     │
│           ↕ Quản lý bởi Global Admin ↕              │
└─────────────────────────────────────────────────────┘
```

### Các Role trong hệ thống

Hệ thống phân quyền theo **2 cấp**: cấp nền tảng (Global) và cấp tổ chức (Tenant).

---

#### 🌐 Global Admin (Quản trị viên toàn cầu)

> Vai trò cấp cao nhất, quản lý toàn bộ nền tảng SEVAP.

**Quyền hạn:**

- Tạo, chỉnh sửa, xóa (soft delete) các Tenant (tổ chức).
- Xem thống kê tổng quan toàn nền tảng: số lượng tenant, người dùng, tài liệu, lượng vector đã lưu trữ.
- Theo dõi hiệu năng LLM (model đang chạy, tài nguyên GPU/CPU).
- Xem nhật ký hoạt động toàn cầu (global activity logs).
- Giám sát tài nguyên hệ thống theo thời gian thực (SSE dashboard).

**Lưu ý:** Global Admin **không thuộc** về bất kỳ Tenant nào (`tenant_id = NULL`).

---

#### 🏢 Tenant Admin (Quản trị viên tổ chức)

> Quản lý toàn bộ hoạt động trong phạm vi một tổ chức (tenant) cụ thể.

**Quyền hạn:**

- Quản lý người dùng trong tổ chức: tạo, cập nhật, vô hiệu hóa tài khoản.
- Quản lý vai trò (role) và phân quyền (permission) cho từng vai trò.
- Quản lý phòng ban (department) và chức danh (job title).
- Tải lên, phân loại và phân quyền truy cập tài liệu.
- Cấu hình prompt template cho AI assistant.
- Xem nhật ký hoạt động trong tổ chức.
- Xem thống kê dashboard của tổ chức.

---

#### 📃Knowledge Manager (Quản lý tri thức)

> Người quản lý tri thức, chịu trách nhiệm quản lý toàn bộ tài liệu và kiến thức trong tổ chức.

**Quyền hạn:**

Tải lên, phân loại và phân quyền truy cập tài liệu.

---

#### 👤 Employee (Nhân viên)

> Người dùng cuối, sử dụng trợ lý ảo để tra cứu thông tin.

**Quyền hạn:**

- Đăng nhập và sử dụng giao diện chat.
- Đặt câu hỏi và nhận câu trả lời từ AI dựa trên tài liệu nội bộ.
- Xem lịch sử hội thoại cá nhân.
- Đổi tên, xóa các cuộc hội thoại.
- Truy cập tài liệu được phép xem theo quyền hạn.

---

#### 🔒 Phân quyền tài liệu (Document Access Level)

| Mức độ       | Mô tả                                                 |
| ------------ | ----------------------------------------------------- |
| `public`     | Toàn bộ nhân viên trong tổ chức đều có thể tra cứu    |
| `managerial` | Chỉ những người dùng có vai trò quản lý trong tổ chức |
| `private`    | Chỉ những người dùng được chỉ định cụ thể             |

---

### Pipeline RAG (LangGraph)

![RAG Workflow](docs/images/Rag%20workflow.png)

---

## 🛠 Công nghệ sử dụng

### Backend

| Thành phần           | Công nghệ                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Web Framework        | [FastAPI](https://fastapi.tiangolo.com/) (Python)                                               |
| AI Orchestration     | [LangGraph](https://github.com/langchain-ai/langgraph)                                          |
| LLM Server           | [Ollama](https://ollama.com/) (`qwen3:8b`, `qwen2.5:3b`)                                        |
| GPU Cloud (tuỳ chọn) | [Modal.com](https://modal.com/)                                                                 |
| Embedding Model      | `BAAI/bge-m3` (1024 chiều)                                                                      |
| Reranker Model       | `BAAI/bge-reranker-v2-m3`                                                                       |
| Database             | [PostgreSQL 16](https://www.postgresql.org/) + [pgvector](https://github.com/pgvector/pgvector) |
| ORM                  | [SQLAlchemy](https://www.sqlalchemy.org/) (async) + Alembic                                     |
| Auth                 | JWT (HS256)                                                                                     |
| Rate Limiting        | SlowAPI                                                                                         |
| Observability        | LangSmith                                                                                       |
| Geo IP               | MaxMind GeoLite2                                                                                |
| Async Runtime        | asyncio / uvicorn                                                                               |

### Frontend

| Thành phần        | Công nghệ                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Framework         | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)             |
| Build Tool        | [Vite 8](https://vite.dev/)                                                                |
| Routing           | [TanStack Router v1](https://tanstack.com/router)                                          |
| State / Cache     | [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query v5](https://tanstack.com/query) |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com/)                                                |
| HTTP Client       | [Axios](https://axios-http.com/)                                                           |
| UI Icons          | [Lucide React](https://lucide.dev/)                                                        |
| Charts            | [Chart.js](https://www.chartjs.org/) + react-chartjs-2                                     |
| Document Preview  | pdfjs-dist, docx-preview                                                                   |
| Notifications     | [Sonner](https://sonner.emilkowal.ski/)                                                    |
| Voice Input       | react-speech-recognition                                                                   |
| Web Server (prod) | [Nginx](https://nginx.org/)                                                                |

### Infrastructure

| Thành phần       | Công nghệ                                          |
| ---------------- | -------------------------------------------------- |
| Containerization | [Docker](https://www.docker.com/) + Docker Compose |
| Database         | PostgreSQL 16 với pgvector extension               |
| LLM Runtime      | Ollama (Docker container, hỗ trợ NVIDIA GPU)       |
| GPU (tuỳ chọn)   | Modal.com (NVIDIA T4)                              |

---

## 🚀 Cách chạy dự án

### Yêu cầu hệ thống

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.20+)
- NVIDIA GPU + [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) _(nếu muốn chạy Ollama với GPU cục bộ)_
- Node.js 20+ _(chỉ cần thiết khi phát triển frontend cục bộ)_
- Python 3.11+ _(chỉ cần thiết khi phát triển backend cục bộ)_

---

### Phương án 1: Chạy toàn bộ bằng Docker Compose _(Khuyến nghị)_

Đây là cách đơn giản và nhanh nhất để khởi động toàn bộ hệ thống.

#### Bước 1: Clone dự án

```bash
git clone <repository-url>
cd sevap
```

#### Bước 2: Cấu hình biến môi trường

Sao chép file mẫu và chỉnh sửa theo môi trường của bạn:

```bash
cp backend/.env.example backend/.env
```

Mở file `backend/.env` và điền các thông tin sau:

```env
# ── Cơ sở dữ liệu ────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sevap
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/sevap

# ── JWT ───────────────────────────────────────────────
JWT_SECRET_KEY=your-secret-key-here-minimum-32-chars

# ── LLM Backend ──────────────────────────────────────
# Chọn "local" để dùng Ollama Docker, hoặc "modal" để dùng GPU cloud
LLM_BACKEND=local
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen3:8b

# ── Modal.com (chỉ cần nếu LLM_BACKEND=modal) ────────
# MODAL_OLLAMA_URL=https://<your-modal-endpoint>
# MODAL_EMBEDDING_URL=https://<your-embed-endpoint>
# MODAL_RERANKER_URL=https://<your-rerank-endpoint>

# ── LangSmith (tuỳ chọn - để theo dõi AI pipeline) ──
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=sevap
```

#### Bước 3: Khởi động các service

```bash
docker compose -p sevap up -d
```

Lệnh này sẽ tự động build và khởi động 4 service:

- `sevap_db` — PostgreSQL + pgvector tại port `5432`
- `sevap_ollama` — Ollama LLM Server tại port `11434`
- `sevap_backend` — FastAPI Backend tại port `8000`
- `sevap_frontend` — React App (Nginx) tại port `3000`

#### Bước 4: Tải model LLM về Ollama

Sau khi container Ollama đã chạy, tải model ngôn ngữ:

```bash
# Model chính (chat & sinh câu trả lời)
docker exec -it sevap_ollama ollama pull qwen3:8b

# Model phụ (intent routing & query rewriting)
docker exec -it sevap_ollama ollama pull qwen2.5:3b
```

> ⚠️ **Lưu ý:** Quá trình tải model có thể mất nhiều thời gian tuỳ thuộc vào tốc độ internet. Model `qwen3:8b` có dung lượng khoảng 5GB.

#### Bước 5: Chạy database migration

```bash
docker exec -it sevap_backend alembic upgrade head
```

#### Bước 6: (Tuỳ chọn) Tạo dữ liệu mẫu

```bash
docker exec -it sevap_backend python seeds/generate_seed_data.py
```

#### Bước 7: Truy cập hệ thống

| Dịch vụ               | URL                                |
| --------------------- | ---------------------------------- |
| 🌐 Giao diện web      | http://localhost:3000              |
| 📡 API Backend        | http://localhost:8000              |
| 📖 API Docs (Swagger) | http://localhost:8000/api/v1/docs  |
| 📖 API Docs (ReDoc)   | http://localhost:8000/api/v1/redoc |
| 🔍 Ollama API         | http://localhost:11434             |

---

### Phương án 2: Chạy Backend cục bộ (cho phát triển)

Dùng khi bạn muốn phát triển backend mà không cần build Docker image mỗi lần.

#### Bước 1: Chạy database và Ollama bằng Docker

```bash
docker compose -p sevap up -d db ollama
```

#### Bước 2: Tạo môi trường Python

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

#### Bước 3: Cài đặt dependencies

```bash
pip install -r requirements.txt
```

#### Bước 4: Cấu hình DATABASE_URL cho môi trường local

Trong file `backend/.env`, đổi `@db:` thành `@localhost:`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sevap
OLLAMA_BASE_URL=http://localhost:11434
```

#### Bước 5: Chạy migration

```bash
alembic upgrade head
```

#### Bước 6: Khởi động backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Phương án 3: Chạy Frontend cục bộ (cho phát triển)

Dùng khi bạn muốn phát triển giao diện với hot-reload.

#### Bước 1: Đảm bảo backend đang chạy (Docker hoặc local)

#### Bước 2: Cài đặt Node dependencies

```bash
cd frontend
npm install
```

#### Bước 3: Cấu hình proxy API

Tạo (hoặc chỉnh sửa) file `frontend/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Bước 4: Khởi động development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173

---

### Các lệnh hữu ích

```bash
# Xem log của tất cả service
docker compose -p sevap logs -f

# Xem log của service cụ thể
docker compose -p sevap logs -f backend
docker compose -p sevap logs -f frontend

# Dừng tất cả service
docker compose -p sevap down

# Dừng và xóa toàn bộ volume (xóa dữ liệu)
docker compose -p sevap down -v

# Rebuild và khởi động lại một service cụ thể
docker compose -p sevap up -d --build backend

# Kiểm tra trạng thái các container
docker compose -p sevap ps

# Tạo migration mới (sau khi thay đổi models)
docker exec -it sevap_backend alembic revision --autogenerate -m "ten_migration"

# Rollback migration
docker exec -it sevap_backend alembic downgrade -1
```

---

### Sử dụng Modal.com GPU (Tuỳ chọn)

Nếu không có GPU cục bộ, bạn có thể dùng [Modal.com](https://modal.com/) để chạy LLM, embedding và reranker trên cloud GPU (NVIDIA T4).

#### Bước 1: Cài đặt Modal CLI

```bash
pip install modal
modal setup
```

#### Bước 2: Deploy các service lên Modal

```bash
# Deploy Ollama LLM server
modal deploy backend/app/ai_brain/llm/ollama_model.py

# Deploy Embedding + Reranker
modal deploy backend/mcp_servers/embed.py
modal deploy backend/mcp_servers/rerank.py
```

#### Bước 3: Cập nhật `.env`

```env
LLM_BACKEND=modal
MODAL_OLLAMA_URL=https://<your-modal-ollama-endpoint>
MODAL_EMBEDDING_URL=https://<your-modal-embed-endpoint>
MODAL_RERANKER_URL=https://<your-modal-rerank-endpoint>
```

---

## 📁 Cấu trúc thư mục

```
sevap/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── ai_brain/           # RAG Pipeline (LangGraph)
│   │   │   ├── graph/          # LangGraph định nghĩa nodes & edges
│   │   │   ├── embeddings/     # Embedding service
│   │   │   ├── retrieval/      # Vector search
│   │   │   ├── chunking/       # Document chunking
│   │   │   ├── llm/            # LLM (Ollama/Modal)
│   │   │   └── prompts/        # Prompt templates
│   │   ├── api/v1/             # REST API endpoints
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Database queries
│   │   ├── core/               # Config, logging, enums
│   │   └── main.py             # FastAPI app entry point
│   ├── migrations/             # Alembic migrations
│   ├── seeds/                  # Seed data scripts
│   └── Dockerfile
├── frontend/                   # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Route pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   └── api/                # API client (Axios)
│   ├── nginx.conf              # Nginx config (production)
│   └── Dockerfile
└── docker-compose.yml          # Docker Compose config
```

---

## 🔒 Bảo mật

- Xác thực bằng **JWT** (Access Token + Refresh Token).
- **Rate limiting** trên toàn bộ endpoints để chống DDoS.
- **Security Kill Switch** trong pipeline RAG: tự động phát hiện và chặn các câu hỏi có dấu hiệu tấn công (prompt injection...).
- **Soft delete**: dữ liệu không bị xóa cứng, hỗ trợ khôi phục.
- **GeoIP logging**: ghi nhận vị trí địa lý của các request để phục vụ kiểm toán.
