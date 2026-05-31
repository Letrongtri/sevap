# Trợ lý Nhân sự thông minh (HR Assistant)

Dự án **HR Assistant** là một hệ thống backend API được xây dựng bằng **FastAPI**, kết hợp với các mô hình ngôn ngữ lớn (LLM) và công nghệ **RAG (Retrieval-Augmented Generation)** để tự động hóa và hỗ trợ các nghiệp vụ nhân sự. Hệ thống cho phép phân tích tài liệu, bóc tách dữ liệu CV, và trả lời các câu hỏi dựa trên cơ sở dữ liệu tri thức nội bộ.

## 🚀 Công nghệ sử dụng

- **Backend Framework:** FastAPI, Uvicorn
- **Database & ORM:** PostgreSQL (tích hợp `pgvector` cho vector search), SQLAlchemy (Async), Alembic (Quản lý migration)
- **AI & RAG:** LangChain, LangGraph, Hugging Face Transformers, Sentence Transformers, Torch
- **Xử lý tài liệu:** Docling, RapidOCR, PyPDFium2, python-docx, openpyxl (xử lý PDF, Word, Excel, hình ảnh)
- **Containerization:** Docker & Docker Compose

---

## 📁 Cấu trúc thư mục dự án

```text
hr_assistant/
│
├── backend/                  # Chứa toàn bộ mã nguồn backend
│   ├── .env                  # Cấu hình biến môi trường
│   ├── alembic.ini           # Cấu hình cho công cụ migration Alembic
│   ├── docker-compose.yml    # File cấu hình Docker Compose để chạy các services
│   ├── Dockerfile            # Cấu hình Docker để build image cho backend
│   ├── requirements.txt      # Danh sách các thư viện Python phụ thuộc
│   │
│   ├── app/                  # Thư mục chứa logic ứng dụng chính
│   │   ├── ai_brain/         # Logic AI cốt lõi, LangChain/LangGraph workflows và xử lý RAG
│   │   ├── api/              # Định nghĩa các Endpoints (Routes) của API (vd: v1)
│   │   ├── core/             # Cấu hình lõi (config, logging, security)
│   │   ├── db/               # Khởi tạo kết nối cơ sở dữ liệu và session
│   │   ├── dependencies/     # Các dependencies tiêm vào FastAPI (vd: get_db, xác thực)
│   │   ├── mcp_client/       # Tích hợp MCP (Model Context Protocol) Client nếu có
│   │   ├── models/           # Định nghĩa các model SQLAlchemy (Tables trong DB)
│   │   ├── repositories/     # Tầng giao tiếp với database (CRUD patterns)
│   │   ├── schemas/          # Pydantic models dùng để validate dữ liệu Request/Response
│   │   ├── services/         # Chứa logic nghiệp vụ (Business logic) của ứng dụng
│   │   ├── tasks/            # Chứa các background tasks (celery hoặc background_tasks)
│   │   ├── utils/            # Các hàm tiện ích dùng chung (helper functions)
│   │   └── main.py           # Điểm khởi chạy chính của ứng dụng FastAPI
│   │
│   ├── data/                 # Thư mục lưu trữ dữ liệu cục bộ hoặc file tạm
│   ├── logs/                 # Thư mục chứa file log của hệ thống
│   ├── mcp_servers/          # Chứa cấu hình cho các MCP servers
│   └── migrations/           # Các scripts migration cho cơ sở dữ liệu (tạo bởi Alembic)
```

---

## 🧩 Chức năng từng phần chi tiết

### 1. `app/api/` (Tầng giao tiếp API)
Nơi định nghĩa toàn bộ các endpoint mà client (Frontend/Mobile) sẽ gọi tới. Các API được thiết kế theo chuẩn RESTful và được phân chia theo phiên bản (ví dụ `api/v1`). Nó chỉ làm nhiệm vụ tiếp nhận request và trả về response, logic xử lý sẽ được đẩy xuống `services`.

### 2. `app/ai_brain/` (Tầng xử lý AI & RAG)
Đây là "bộ não" của hệ thống trợ lý. 
- Xây dựng các chuỗi xử lý bằng **LangChain** và **LangGraph**.
- Thực hiện Embedding tài liệu thông qua `sentence-transformers`.
- Truy xuất thông tin (Retrieval) từ cơ sở dữ liệu vector.
- Tương tác với LLMs nội bộ hoặc bên ngoài.

### 3. `app/services/` (Tầng nghiệp vụ - Business Logic)
Chứa các class/hàm xử lý nghiệp vụ phức tạp. Ví dụ: dịch vụ quản lý người dùng, dịch vụ phân tích CV, dịch vụ xử lý câu hỏi nghiệp vụ nhân sự. Service sẽ gọi `repositories` để lấy/lưu dữ liệu và gọi `ai_brain` nếu cần tính toán AI.

### 4. `app/repositories/` (Tầng truy cập dữ liệu - Data Access)
Cô lập việc truy vấn cơ sở dữ liệu khỏi các phần khác của ứng dụng. Cung cấp các hàm chuẩn hóa như `get`, `create`, `update`, `delete` cho từng Model. 

### 5. `app/models/` và `app/schemas/`
- **`models/`**: Khai báo các đối tượng SQLAlchemy tương ứng với các bảng trong PostgreSQL.
- **`schemas/`**: Khai báo các class Pydantic định nghĩa kiểu dữ liệu cho Body của request và cấu trúc của response, giúp FastAPI tự động validate dữ liệu.

### 6. `app/db/` & `migrations/`
- **`db/`**: Chứa logic kết nối đến PostgreSQL bằng `asyncpg`. Thiết lập session cho CSDL.
- **`migrations/`**: Quản lý việc thay đổi cấu trúc bảng trong CSDL (schema versioning). Khi tạo thêm bảng mới, Alembic sẽ sinh script tại đây.

### 7. Hạ tầng (Docker & Postgres)
File `docker-compose.yml` định nghĩa 2 services chính:
- **`db`**: Database PostgreSQL với extension `pgvector` dùng để lưu trữ dữ liệu quan hệ và vector embeddings cho các tài liệu (CV, quy định công ty).
- **`backend`**: Ứng dụng FastAPI chính.
- *(Tùy chọn)* Hỗ trợ cấu hình chạy **Ollama** cục bộ cho LLMs nếu muốn bảo mật dữ liệu tuyệt đối (100% on-premise).

---

## 🛠 Hướng dẫn khởi chạy nhanh

**Yêu cầu:** Hệ thống cần cài đặt sẵn Docker và Docker Compose.

1. **Khởi động hệ thống:**
   Mở terminal tại thư mục `backend/` và chạy:
   ```bash
   docker-compose up -d
   ```
2. **Kiểm tra trạng thái:**
   ```bash
   docker-compose ps
   ```
3. **Truy cập tài liệu API:**
   Mở trình duyệt và truy cập:
   - **Swagger UI**: `http://localhost:8000/api/v1/docs`
   - **ReDoc**: `http://localhost:8000/api/v1/redoc`

*(Lưu ý: Bạn có thể cần copy file cấu hình mẫu `.env.example` thành `.env` trước khi khởi chạy nếu dự án yêu cầu cấu hình biến môi trường cụ thể).*
