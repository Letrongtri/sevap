import httpx
import time
from datetime import datetime
from app.repositories import GlobalAdminRepository
from app.schemas import (
    TenantSummaryResponse, VectorStorageResponse,
    LLMMetricsResponse
)
from app.core.enum import TenantStatus
from app.core.logging import logger
from app.core.config import settings

class GlobalAdminService:
    def __init__(self, repo: GlobalAdminRepository):
        self.repo = repo

    async def get_tenant_summary(self) -> TenantSummaryResponse:
        try:
            # Count total tenants
            count_by_status = await self.repo.count_tenant_by_status()

            total_tenants = count_by_status.get(TenantStatus.ACTIVE.value, 0) + \
                count_by_status.get(TenantStatus.INACTIVE.value, 0) + \
                count_by_status.get(TenantStatus.SUSPENDED.value, 0)

            active_tenants = count_by_status.get(TenantStatus.ACTIVE.value, 0)
            suspended_tenants = count_by_status.get(TenantStatus.SUSPENDED.value, 0)
            
            # Count new tenants this month
            now = datetime.utcnow()
            first_day_of_month = datetime(now.year, now.month, 1)
            new_tenants = await self.repo.count_tenant_new_in_month(first_day_of_month)
            
            return TenantSummaryResponse(
                total_tenants=total_tenants,
                active_tenants=active_tenants,
                suspended_tenants=suspended_tenants,
                new_tenants_this_month=new_tenants
            )
        except Exception as e:
            logger.error("get_tenant_summary_failed", error=str(e), exc_info=True)
            raise

    async def get_vector_storage_info(self) -> VectorStorageResponse:
        try:
            total_chunks = await self.repo.count_chunks()
            total_embeddings = await self.repo.count_embeddings()
            embedding_size_bytes, embedding_size_human = await (
                self.repo.get_embedding_size_bytes()
            )

            return VectorStorageResponse(
                total_chunks=total_chunks,
                total_embeddings=total_embeddings,
                embedding_size_bytes=embedding_size_bytes,
                embedding_size_human=embedding_size_human
            )
        except Exception as e:
            logger.error("vector_storage_info_failed", error=str(e), exc_info=True)
            raise

    async def get_llm_metrics(self) -> LLMMetricsResponse:
        OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
        
        async with httpx.AsyncClient() as client:
            try:
                start_time = time.time()
                # 1. Gọi đến endpoint hệ thống của Ollama để lấy danh sách model đang active
                response = await client.get(f"{OLLAMA_BASE_URL}/api/ps", timeout=3.0)
                
                if response.status_code == 200:
                    ollama_data = response.json()
                    raw_models = ollama_data.get("models", [])
                    
                    # 2. Bóc tách dữ liệu thực tế từ cấu trúc JSON của Ollama
                    active_models = []
                    total_vram_bytes = 0
                    
                    for model in raw_models:
                        # Lấy tên model (Ví dụ: "llama3:latest", "qwen2.5:7b")
                        model_name = model.get("name", "Unknown")
                        active_models.append(model_name)
                        
                        # Tính toán dung lượng bộ nhớ mà mô hình này đang chiếm dụng thực tế
                        # Ollama trả về trường 'size_vram' hoặc trường 'size' thô tùy phiên bản
                        model_size = model.get("size", 0)
                        total_vram_bytes += model_size
                    
                    # Chuyển đổi bytes sang Megabytes (MB) để hiển thị Dashboard trực quan
                    total_vram_mb = round(total_vram_bytes / (1024 * 1024), 2)
                    
                    # 3. Đánh giá tải và hàng đợi (Request Queue) bằng một mẹo kiến trúc:
                    # Nếu Ollama đang phải nạp (loading) hoặc xử lý đồng thời, trạng thái phản hồi 
                    # của API /api/ps vẫn giữ được tốc độ nhanh, nhưng ta có thể ước lượng tải 
                    # qua số lượng mô hình đang bị ép chạy cùng một lúc (Vượt ngưỡng tài nguyên).
                    # Hệ thống Ollama mặc định xử lý luồng tuần tự/song song giới hạn theo OLLAMA_NUM_PARALLEL.
                    is_busy = any(model.get("status", "") == "processing" for model in raw_models)
                    predicted_queue = 1 if is_busy else 0
                    
                    return LLMMetricsResponse(
                        provider="Ollama (Local Engine Cluster)",
                        active_models=active_models,
                        total_vram_allocated_mb=total_vram_mb,
                        request_queue_length=predicted_queue,
                        status="healthy"
                    )
                else:
                    return LLMMetricsResponse(
                        provider="Ollama (Local Engine Cluster)",
                        active_models=[],
                        total_vram_allocated_mb=0.0,
                        request_queue_length=0,
                        status=f"unhealthy (HTTP {response.status_code})"
                    )
                    
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                # Ghi nhật ký lỗi hệ thống nếu Ollama Server đột ngột sập (Crash) hoặc chưa bật dịch vụ
                return LLMMetricsResponse(
                    provider="Ollama (Local Engine Cluster)",
                    active_models=[],
                    total_vram_allocated_mb=0.0,
                    request_queue_length=0,
                    status="offline (Connection Refused)"
                )
