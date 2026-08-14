from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.enum import IntentType, RetrievalExecutionPlan


class SubQuery(BaseModel):
    """Câu hỏi con trong kế hoạch thực thi Multi-RAG."""
    id: int = Field(..., description="Execution order of sub-queries")
    query: str = Field(..., description="Sub-query content")
    depends_on: Optional[List[int]] = Field(
        default=[], description="ID of sub-queries that need to be completed before this sub-query"
    )


class TimeRangeFilter(BaseModel):
    """Khoảng thời gian được trích xuất từ câu hỏi của người dùng."""
    date_from: Optional[str] = Field(
        default=None,
        description="Ngày bắt đầu khoảng thời gian, định dạng ISO 'YYYY-MM-DD'. None nếu không giới hạn."
    )
    date_to: Optional[str] = Field(
        default=None,
        description="Ngày kết thúc khoảng thời gian, định dạng ISO 'YYYY-MM-DD'. None nếu không giới hạn."
    )
    is_time_sensitive: bool = Field(
        default=False,
        description="True nếu câu hỏi ngụ ý một khoảng thời gian cụ thể cần lọc dữ liệu."
    )


class RouterOutputSchema(BaseModel):
    """Output schema của IntentRouter sau khi phân tích và phân rã câu hỏi."""
    original_query: str = Field(..., description="Original query")
    rewritten_query: str = Field(
        ..., description="Original query rewritten completely based on conversation history"
    )
    intent_type: IntentType = Field(
        ..., description="Intent type: 'direct' or 'single_rag' or 'multi_rag'"
    )
    execution_plan: RetrievalExecutionPlan = Field(
        ..., description="Execution plan of the task: 'direct' or 'parallel' or 'sequential'"
    )
    sub_queries: List[SubQuery] = Field(
        default=[], description="List of sub-queries (Empty if 'direct')"
    )
    reasoning: str = Field(..., description="Reasoning for choosing the strategy")
    time_range: TimeRangeFilter = Field(
        default_factory=TimeRangeFilter,
        description="Khoảng thời gian được trích xuất từ câu hỏi."
    )
