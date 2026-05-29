from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    uploader_id: int
    title: str
    access_level: str
    department_scope: str | None = None
    file_name: str
    file_type: str | None = None
    file_path: str
    file_size: int | None = None
    status: str | None = None
    category: str | None = None
    effective_date: datetime | None = None
    meta_data: dict | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)