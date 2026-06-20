from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional

class HRGraphState(TypedDict):
    query: str
    user_id: str
    role_ids: list[str]
    role_access_level: str
    agent_type: Optional[str]    # filled by router
    answer: Optional[str]
    sources: Optional[list]

# V1 graph: input → policy_node → END
# (bạn thêm node personal/action sau)