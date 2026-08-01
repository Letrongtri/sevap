from pydantic import BaseModel, ConfigDict

class DirectoryOverviewResponse(BaseModel):
    users_count: int
    documents_count: int
    departments_count: int
    job_titles_count: int

    model_config = ConfigDict(from_attributes=True)
