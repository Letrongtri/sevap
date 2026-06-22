from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.core.enum import LogLevel
from app.schemas.base_schema import PaginationResponse

class ActivityLogCreate(BaseModel):
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    meta_data: Optional[dict] = None
    ip_address: Optional[str] = None
    log_level: LogLevel

class ActivityLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    meta_data: Optional[dict] = None
    ip_address: Optional[str] = None
    log_level: LogLevel
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityLogQuery(BaseModel):
    action: Optional[str] = None
    resource: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    log_level: Optional[LogLevel] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ActivityLogPaginatedResponse(BaseModel):
    data: list[ActivityLogResponse]
    pagination: PaginationResponse