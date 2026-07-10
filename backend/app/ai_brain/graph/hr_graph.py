from functools import partial
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.checkpoint.memory import MemorySaver
from app.ai_brain.graph.nodes import *
from app.ai_brain.state import AgentState
from app.ai_brain.retrieval import RetrievalService
from app.core.enum import IntentType, GraphNodeID


def route_after_intent(state: AgentState) -> str:
    """Routing sau intent_node dựa trên kết quả phân loại."""
    intent = state.get("intent_type", IntentType.SINGLE_RAG.value)
    mapping = {
        IntentType.DIRECT.value: GraphNodeID.DIRECT_RESPONSE_GENERATOR.value,
        IntentType.SINGLE_RAG.value: GraphNodeID.RETRIEVAL.value,
        IntentType.MULTI_RAG.value: GraphNodeID.RETRIEVAL.value,
        IntentType.UNKNOWN.value: GraphNodeID.FALLBACK_NODE.value,
        IntentType.SECURITY_ANOMALY.value: GraphNodeID.SECURITY_KILL_SWITCH.value,
    }
    return mapping.get(intent, GraphNodeID.RETRIEVAL.value)


def route_after_rewrite(state: AgentState) -> str:
    """Routing sau rewrite_node — có thể đi RETRIEVAL hoặc SECURITY_KILL_SWITCH."""
    next_node = state.get("_next", GraphNodeID.RETRIEVAL.value)
    # Normalize: chỉ cho phép các node hợp lệ
    allowed = {
        GraphNodeID.RETRIEVAL.value,
        GraphNodeID.SECURITY_KILL_SWITCH.value,
    }
    return next_node if next_node in allowed else GraphNodeID.RETRIEVAL.value


def route_after_threshold(state: AgentState) -> str:
    """Routing sau threshold_check_node dựa trên _next signal."""
    return state.get("_next", GraphNodeID.FALLBACK_NODE.value)


def build_hr_graph(retrieval_service: RetrievalService, checkpointer=None) -> CompiledStateGraph:
    """
    Factory function: tạo và compile graph.
    Nhận RetrievalService qua DI thay vì import trực tiếp — dễ test, dễ mock.

    Pipeline retrieval:
        retrieval_node → rerank_node → threshold_check_node
    """
    graph = StateGraph(AgentState)

    # ── Đăng ký tất cả nodes ──────────────────────────────────────────────────
    graph.add_node(GraphNodeID.INTENT_ROUTER.value, intent_node)
    graph.add_node(GraphNodeID.DIRECT_RESPONSE_GENERATOR.value, direct_node)

    # partial() inject retrieval_service vào node mà không thay đổi signature
    graph.add_node(GraphNodeID.RETRIEVAL.value, partial(retrieval_node, retrieval_service=retrieval_service))
    graph.add_node(GraphNodeID.RERANK.value, rerank_node)
    graph.add_node(GraphNodeID.THRESHOLD_CHECK.value, threshold_check_node)
    graph.add_node(GraphNodeID.REWRITE.value, rewrite_node)
    graph.add_node(GraphNodeID.FINAL_RESPONSE_GENERATOR.value, generate_final_response_node)
    graph.add_node(GraphNodeID.FALLBACK_NODE.value, fallback_node)
    graph.add_node(GraphNodeID.SECURITY_KILL_SWITCH.value, security_kill_switch_node)

    # ── Entry point ───────────────────────────────────────────────────────────
    graph.set_entry_point(GraphNodeID.INTENT_ROUTER.value)

    # ── Edges tĩnh (unconditional) ────────────────────────────────────────────
    graph.add_edge(GraphNodeID.DIRECT_RESPONSE_GENERATOR.value, END)
    graph.add_edge(GraphNodeID.RETRIEVAL.value, GraphNodeID.RERANK.value)        # retrieval → rerank
    graph.add_edge(GraphNodeID.RERANK.value, GraphNodeID.THRESHOLD_CHECK.value)  # rerank → threshold
    graph.add_edge(GraphNodeID.FINAL_RESPONSE_GENERATOR.value, END)
    graph.add_edge(GraphNodeID.FALLBACK_NODE.value, END)
    graph.add_edge(GraphNodeID.SECURITY_KILL_SWITCH.value, END)

    # ── Edges điều kiện (conditional) ────────────────────────────────────────
    graph.add_conditional_edges(
        source   = GraphNodeID.INTENT_ROUTER.value,
        path     = route_after_intent,
        path_map = {
            GraphNodeID.DIRECT_RESPONSE_GENERATOR.value: GraphNodeID.DIRECT_RESPONSE_GENERATOR.value,
            GraphNodeID.RETRIEVAL.value: GraphNodeID.RETRIEVAL.value,
            GraphNodeID.FALLBACK_NODE.value: GraphNodeID.FALLBACK_NODE.value,
            GraphNodeID.SECURITY_KILL_SWITCH.value: GraphNodeID.SECURITY_KILL_SWITCH.value,
        },
    )

    graph.add_conditional_edges(
        source   = GraphNodeID.THRESHOLD_CHECK.value,
        path     = route_after_threshold,
        path_map = {
            GraphNodeID.FINAL_RESPONSE_GENERATOR.value: GraphNodeID.FINAL_RESPONSE_GENERATOR.value,
            GraphNodeID.REWRITE.value: GraphNodeID.REWRITE.value,
            GraphNodeID.FALLBACK_NODE.value: GraphNodeID.FALLBACK_NODE.value,
        },
    )

    # rewrite_node có thể route sang RETRIEVAL (normal retry) hoặc SECURITY_KILL_SWITCH (anomaly phát hiện lần 2)
    graph.add_conditional_edges(
        source   = GraphNodeID.REWRITE.value,
        path     = route_after_rewrite,
        path_map = {
            GraphNodeID.RETRIEVAL.value: GraphNodeID.RETRIEVAL.value,
            GraphNodeID.SECURITY_KILL_SWITCH.value: GraphNodeID.SECURITY_KILL_SWITCH.value,
        },
    )

    # TODO: sử dụng PostgresSaver
    if checkpointer is None:
        checkpointer = MemorySaver()

    return graph.compile(checkpointer=checkpointer)
