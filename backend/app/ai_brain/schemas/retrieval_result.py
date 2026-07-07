from typing import Optional
from pydantic import BaseModel


class RetrievalResult(BaseModel):
    """Kết quả truy xuất từ Hybrid Search Pipeline (Vector + Keyword)."""
    chunk_id: str
    document_id: str
    content: str
    score: float
    doc_title: str
    metadata: Optional[dict] = None
