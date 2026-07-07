from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.enum import IntentType, RetrievalExecutionPlan

class SubQuery(BaseModel):
    id: int = Field(..., description="Execution order of sub-queries")
    query: str = Field(..., description="Sub-query content")
    depends_on: Optional[List[int]] = Field(default=[], description="ID of sub-queries that need to be completed before this sub-query")

class RouterOutputSchema(BaseModel):
    original_query: str = Field(..., description="Original query")
    rewritten_query: str = Field(..., description="Original query rewritten completely based on conversation history")
    intent_type: IntentType = Field(..., description="Intent type: 'direct' or 'single_rag' or 'multi_rag'")
    execution_plan: RetrievalExecutionPlan = Field(..., description="Execution plan of the task: 'direct' or 'parallel' or 'sequential'")
    sub_queries: List[SubQuery] = Field(default=[], description="List of sub-queries (Empty if 'direct')")
    reasoning: str = Field(..., description="Reasoning for choosing the strategy")