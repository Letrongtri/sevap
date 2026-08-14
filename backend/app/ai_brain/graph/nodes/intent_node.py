import time
from langchain_core.runnables import RunnableConfig

from app.ai_brain.schemas import UserSecurityContext
from app.ai_brain.state import AgentState
from app.ai_brain.router import check_heuristic_intent, IntentRouter
from app.core.enum import IntentType, GraphNodeID, RetrievalExecutionPlan
from app.core.logging import logger


async def intent_node(state: AgentState, config: RunnableConfig) -> dict:
    """Phân loại ý định người dùng từ câu hỏi và lịch sử hội thoại.
    Returns:
        dict with intent, sub_queries, time_range, next_node, messages
    """
    t_start = time.perf_counter()
    security_ctx: UserSecurityContext = config["configurable"]["user_security_ctx"]
    chat_history = config["configurable"].get("chat_history", [])
    tenant_id = security_ctx.tenant_id
    original_question = state["original_question"]

    # TIER-0: Heuristic Filter
    heuristic = check_heuristic_intent(original_question)
    if heuristic and heuristic.matched:
        latency_ms = (time.perf_counter() - t_start) * 1000
        logger.debug(
            "[HeuristicFilter] MATCH | query=%r | category=%s(%s) | latency=%.3fms",
            original_question, heuristic.category_code,
            heuristic.category_name, latency_ms
        )
        return {
            "rewritten_question": original_question,
            "intent_type": IntentType.DIRECT.value,
            "execution_plan": RetrievalExecutionPlan.DIRECT.value,
            "sub_queries": [],
            "sub_query_chunks": [],
            "failed_sub_query_ids": [],
            "passed_sub_query_ids": [],
            "retrieved_chunks": [],
            "reranked_chunks": [],
            "router_reasoning": "Tier-0 heuristic match: {}".format(heuristic.category_name),
            "time_range": {"date_from": None, "date_to": None, "is_time_sensitive": False},
            "_next": GraphNodeID.DIRECT_RESPONSE_GENERATOR.value,
        }

    # TIER-1: LLM Intent Router
    router = IntentRouter()
    router_output = await router.route_intent(
        history_messages=chat_history,
        current_query=original_question,
        tenant_id=tenant_id
    )

    if router_output.intent_type == IntentType.SECURITY_ANOMALY:
        latency_ms = (time.perf_counter() - t_start) * 1000
        logger.warning(
            "[SecurityKillSwitch] Triggered | query=%r | reasoning=%r | tenant_id=%r | latency=%.3fms",
            original_question, router_output.reasoning, tenant_id, latency_ms
        )
        return {
            "rewritten_question": "MALICIOUS INPUT DETECTED",
            "intent_type": IntentType.SECURITY_ANOMALY.value,
            "execution_plan": RetrievalExecutionPlan.UNKNOWN.value,
            "sub_queries": [],
            "sub_query_chunks": [],
            "failed_sub_query_ids": [],
            "passed_sub_query_ids": [],
            "retrieved_chunks": [],
            "reranked_chunks": [],
            "router_reasoning": router_output.reasoning,
            "time_range": {"date_from": None, "date_to": None, "is_time_sensitive": False},
            "_next": GraphNodeID.SECURITY_KILL_SWITCH.value,
        }

    return {
        "rewritten_question": router_output.rewritten_query,
        "intent_type": router_output.intent_type.value,
        "execution_plan": router_output.execution_plan.value,
        "sub_queries": router_output.sub_queries,
        "sub_query_chunks": [],
        "failed_sub_query_ids": [],
        "passed_sub_query_ids": [],
        "retrieved_chunks": [],
        "reranked_chunks": [],
        "router_reasoning": router_output.reasoning,
        "time_range": router_output.time_range.model_dump(),
        "_next": GraphNodeID.RETRIEVAL.value
    }
