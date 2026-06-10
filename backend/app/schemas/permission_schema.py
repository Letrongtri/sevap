from pydantic import BaseModel, ConfigDict

class PermissionResponse(BaseModel):
    id: int
    resource: str
    action: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)
