from pydantic import BaseModel

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
    tokens_per_second: float
    request_queue_length: int
    active_context_loaders: int
    status: str