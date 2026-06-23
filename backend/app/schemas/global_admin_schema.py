from pydantic import BaseModel
from typing import List, Dict, Any

class TenantSummaryResponse(BaseModel):
    total_tenants: int
    active_tenants: int
    suspended_tenants: int
    new_tenants_this_month: int

class VectorStorageResponse(BaseModel):
    total_chunks: int
    total_embeddings: int
    embedding_size_bytes: int
    embedding_size_human: str

class LLMMetricsResponse(BaseModel):
    provider: str
    tokens_per_second: float = 0.0
    request_queue_length: int
    active_context_loaders: int = 0
    status: str
    active_models: List[str] = []
    total_vram_allocated_mb: float = 0.0

class GrowthVelocityItem(BaseModel):
    month: str
    new_tenants: int
    new_users: int

class TenantDensityItem(BaseModel):
    company_name: str
    storage_gb: float
    tokens_24h: int
    users_count: int

class OllamaAllocationNode(BaseModel):
    node_name: str
    vram_allocated_pct: float
    system_ram_used_pct: float

class DashboardStatsResponse(BaseModel):
    tenants_matrix: Dict[str, Any]
    total_active_users: Dict[str, Any]
    vector_chunks: Dict[str, Any]
    avg_retrieval_latency: Dict[str, Any]
    total_storage: Dict[str, Any]
    docs_status: Dict[str, Any]
    growth_velocity: List[GrowthVelocityItem]
    pipeline_error_distribution: Dict[str, int]
    tenant_density: List[TenantDensityItem]
    ollama_allocation: List[OllamaAllocationNode]