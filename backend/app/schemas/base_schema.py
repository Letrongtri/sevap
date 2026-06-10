from pydantic import BaseModel

class PaginationQuery(BaseModel):
    page: int = 1
    limit: int = 10

class PaginationResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
