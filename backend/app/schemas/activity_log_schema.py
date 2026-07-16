from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from app.core.enum import LogLevel, SortOrder
from app.schemas.base_schema import PaginationResponse

class ActivityLogCreate(BaseModel):
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    meta_data: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    log_level: LogLevel

class ActivityLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    employee_code: Optional[str] = None
    tenant_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    ip_address: Optional[str] = None
    log_level: LogLevel
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityLogDetailResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    employee_code: Optional[str] = None
    email: Optional[str] = None
    tenant_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    meta_data: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = None
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
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[SortOrder] = SortOrder.DESC

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in [
            "user_name", "employee_code", "tenant_id", 
            "action", "resource", "log_level", "created_at"
        ]:
            raise ValueError("Invalid sort_by field")
        return v

class ActivityLogPaginatedResponse(BaseModel):
    data: list[ActivityLogResponse]
    pagination: PaginationResponse