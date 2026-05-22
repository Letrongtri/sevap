from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime

class PermissionResponse(BaseModel):
    id: int
    resource: str
    action: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)
