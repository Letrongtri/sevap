from dataclasses import dataclass, field
from typing import Optional

from pydantic import BaseModel

from app.core.enum import AccessLevel

ACCESS_LEVEL_HIERARCHY = {
    AccessLevel.PUBLIC: 0, 
    AccessLevel.PRIVATE: 1, 
    AccessLevel.MANAGERIAL: 2
}

@dataclass
class PARContext:
    user_id: int
    role_ids: list[int]
    role_access_level: str   # level cao nhất trong các role của user
    
    def allowed_access_levels(self) -> list[str]:
        """Trả về tất cả access levels mà user này được phép đọc."""
        max_level = ACCESS_LEVEL_HIERARCHY.get(self.role_access_level, 0)
        return [
            level for level, rank in ACCESS_LEVEL_HIERARCHY.items()
            if rank <= max_level
        ]

class RetrievalResult(BaseModel):
    chunk_id: int
    document_id: int
    content: str
    score: float
    doc_title: str
    metadata: Optional[dict] = field(default_factory=dict)
