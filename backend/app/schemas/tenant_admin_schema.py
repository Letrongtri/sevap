from datetime import datetime
from pydantic import BaseModel, field_validator

class AdminTenantOverviewResponse(BaseModel):
    total_users: int
    total_custom_roles: int
    total_departments: int
    total_job_titles: int
    total_documents: int
    total_embeddings: int
    total_storage: float

class AdminTenantChatStatisticsQuery(BaseModel):
    group_by: str = "date"
    from_date: datetime | None = None
    to_date: datetime | None = None

    @field_validator("group_by")
    @classmethod
    def validate_group_by(cls, v: str) -> str:
        if v not in ["date", "week", "month", "year"]:
            raise ValueError("group_by must be one of 'date', 'week', 'month' or 'year'")
        return v

class AdminTenantChatStatisticsItem(BaseModel):
    total_conversations: int
    total_messages: int

class AdminTenantChatStatisticsResponse(BaseModel):
    data: dict[str, AdminTenantChatStatisticsItem]

class AdminTenantDocumentStatisticsResponse(BaseModel):
    public_documents: int
    private_documents: int
    managerial_documents: int
