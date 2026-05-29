# Sử dụng Python image bản slim để tối ưu hóa kích thước container
FROM python:3.11-slim as base

# Cấu hình các biến môi trường cho Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt các công cụ hệ thống cần thiết (để biên dịch các package nếu cần)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Tách lớp (layer) cài đặt thư viện để tối ưu cache của Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn của dự án vào container
COPY . .

# Mở cổng 8000 để truy cập vào FastAPI
EXPOSE 8000

# Lệnh khởi chạy Uvicorn server hỗ trợ Auto-Reload phục vụ phát triển
CMD sh -c "pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
