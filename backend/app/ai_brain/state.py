from typing import Any, Dict, TypedDict

from app.ai_brain.schemas import PARContext


class AgentState(TypedDict):
    question: str
    user_context: PARContext
    chat_history: list[Dict[str, Any]]
    selected_agent: str
    confidence_score: float
    retrieval_context: list[Dict[str, Any]]
    final_answer: str
