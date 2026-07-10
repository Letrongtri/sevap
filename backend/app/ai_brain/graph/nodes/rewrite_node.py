from app.ai_brain.schemas import SubQuery
from app.core.enum import RetrievalExecutionPlan
from app.core.enum import IntentType
import json
from langchain_core.messages import HumanMessage, SystemMessage
from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    REWRITE_QUERY_SYSTEM_PROMPT,
    REWRITE_QUERY_USER_PROMPT,
)
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.enum import GraphNodeID
from app.utils.json_utils import clean_and_extract_json

async def rewrite_node(state: AgentState) -> dict:
    question = state["original_question"]
    chat_history = state["chat_history"]
    failed_rewritten_question = state.get("rewritten_question", "")
    failed_subqueries = state.get("sub_queries", [])
    
    model_name = settings.OLLAMA_SLM_MODEL
    llm = get_llm(
        model_name=model_name, temperature=0.6,
        format_json=True
    )

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}" 
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."

    if failed_subqueries:
        failed_subqueries_str = "\n".join([
            (
                f"Q{sq.id}: {sq.query} (depends_on: {sq.depends_on or []})"
                if hasattr(sq, "id")
                else f"Q{sq.get('id')}: {sq.get('query')} (depends_on: {sq.get('depends_on', [])})"
            )
            for sq in failed_subqueries
        ])
    else:
        failed_subqueries_str = "No failed subqueries."
    
    messages = [
        SystemMessage(content=REWRITE_QUERY_SYSTEM_PROMPT),
        HumanMessage(content=REWRITE_QUERY_USER_PROMPT.format(
            history=history_context,
            original_question=question,
            rewritten_question=failed_rewritten_question,
            sub_queries=failed_subqueries_str
        )),
    ]
    
    response = await llm.ainvoke(messages)
    raw_content = response.content.strip()

    # Clean and extract JSON using the robust pipeline
    clean_json_str = clean_and_extract_json(raw_content)
    
    response_dict = json.loads(clean_json_str)

    if response_dict.get("is_security_anomaly", False):
        return {
            "rewritten_question": "SECURITY WARNING: Malicious input detected.",
            "intent_type": IntentType.SECURITY_ANOMALY.value,
            "execution_plan": RetrievalExecutionPlan.UNKNOWN.value,
            "sub_queries": [],
            "reasoning": response_dict.get("reasoning", "Phát hiện Prompt Injection hoặc leo thang đặc quyền."),
            "_next": GraphNodeID.SECURITY_KILL_SWITCH.value,
        }

    raw_subs = response_dict.get("sub_queries", [])
    sub_queries_objs = [SubQuery(**q) for q in raw_subs]

    # 2. Xử lý logic Heuristic xác định Strategy & Cấu trúc Kế hoạch thực thi bằng Python Code
    if not sub_queries_objs or len(sub_queries_objs) == 1:
        # Trường hợp Single RAG
        fallback_query = sub_queries_objs[0].query if sub_queries_objs else question
        sub_query = SubQuery(
            id=1,
            query=fallback_query or question,
            depends_on=[]
        )
        return {
            "rewritten_question": response_dict.get("rewritten_query", question),
            "intent_type": IntentType.SINGLE_RAG.value,
            "execution_plan": RetrievalExecutionPlan.PARALLEL.value,
            "sub_queries": [sub_query],
            "router_reasoning": response_dict.get("reasoning", "Mô hình phân tích thấy câu hỏi đơn lẻ, thực thi song song."),
            "retry_count": state.get("retry_count", 0) + 1,
            "_next": GraphNodeID.RETRIEVAL.value,
        }

    # Trường hợp Multi RAG          
    # Xác định loại hình thực thi dựa trên số lượng Batch sinh ra
    has_dependencies = any(len(q.depends_on) > 0 for q in sub_queries_objs)
    if not has_dependencies:
        plan_type = RetrievalExecutionPlan.PARALLEL
        reasoning = response_dict.get("reasoning", "Toàn bộ các câu hỏi con độc lập hoàn toàn, thực thi song song 100%.")
    else:
        plan_type = RetrievalExecutionPlan.SEQUENTIAL
        reasoning = response_dict.get("reasoning", "Chuỗi xử lý tính toán tuần tự nghiêm ngặt.")

    return {
        "rewritten_question": response_dict.get("rewritten_query", question),
        "intent_type": IntentType.MULTI_RAG.value,
        "execution_plan": plan_type.value,
        "sub_queries": sub_queries_objs,
        "router_reasoning": reasoning,
        "retry_count": state.get("retry_count", 0) + 1,
        "_next": GraphNodeID.RETRIEVAL.value,
    }
