import inspect
import json
import logging
from datetime import datetime
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from app.ai_brain.graph.nodes import *
from app.ai_brain.state import AgentState
from app.core.enum import IntentType, GraphNodeID
from app.core.config import settings


# ── Graph Debug File Logger ───────────────────────────────────────────────────
# Ghi debug output của từng node ra file riêng (plain text, dễ đọc).
# File: logs/graph_debug_YYYY-MM-DD.log — append mode, mới mỗi ngày.
# Chỉ được tạo khi DEBUG=True (development), production không ảnh hưởng.
def _get_graph_debug_logger() -> logging.Logger | None:
    if not settings.DEBUG:
        return None

    log_dir = settings.LOG_DIR
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"graph_debug_{datetime.now().strftime('%Y-%m-%d')}.log"

    _logger = logging.getLogger("hr_graph_debug")
    if not _logger.handlers:          # tránh duplicate handler khi reload
        handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(message)s"))
        _logger.addHandler(handler)
        _logger.setLevel(logging.DEBUG)
        _logger.propagate = False     # không đẩy lên root logger → không ra terminal

    return _logger


_graph_debug_logger = _get_graph_debug_logger()


def _make_debug_node(node_fn, node_name: str):
    """Wrap một node function để ghi toàn bộ output ra file debug.
    Chỉ active khi settings.DEBUG = True (development).
    Output: logs/graph_debug_YYYY-MM-DD.log

    Tự động phát hiện signature của node_fn:
      - (state, config) → gọi với cả hai
      - (state)         → chỉ gọi với state
    """
    if not settings.DEBUG or _graph_debug_logger is None:
        return node_fn

    # Kiểm tra 1 lần lúc wrap, không kiểm tra lại mỗi lần gọi
    _params = list(inspect.signature(node_fn).parameters.keys())
    _accepts_config = len(_params) >= 2

    async def _debug_wrapper(state: AgentState, config):
        result = await node_fn(state, config) if _accepts_config else await node_fn(state)
        try:
            serializable = json.dumps(
                result,
                default=lambda o: o.model_dump() if hasattr(o, "model_dump") else str(o),
                ensure_ascii=False,
                indent=2,
            )
        except Exception:
            serializable = str(result)

        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        block = (
            f"\n{'═' * 70}\n"
            f"[{ts}]  NODE: {node_name}\n"
            f"{'─' * 70}\n"
            f"{serializable}\n"
            f"{'═' * 70}\n"
        )
        _graph_debug_logger.debug(block)
        return result

    return _debug_wrapper


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


def build_hr_graph(checkpointer=None) -> CompiledStateGraph:
    """
    Factory function: tạo và compile graph.

    RetrievalService được inject per-request vào AgentState khi invoke —
    không cần bind lúc compile. Điều này cho phép mỗi request dùng
    AsyncSession riêng biệt, tránh race condition.

    Pipeline retrieval:
        retrieval_node → rerank_node → threshold_check_node
    """
    graph = StateGraph(AgentState)

    # ── Đăng ký tất cả nodes ──────────────────────────────────────────────────
    # Khi DEBUG=True (development), mỗi node được wrap bởi _make_debug_node
    # để tự động log toàn bộ output dict sau khi node chạy xong.
    graph.add_node(GraphNodeID.INTENT_ROUTER.value,            _make_debug_node(intent_node,                 "intent_node"))
    graph.add_node(GraphNodeID.DIRECT_RESPONSE_GENERATOR.value,_make_debug_node(direct_node,                 "direct_node"))

    # retrieval_node lấy retrieval_service từ AgentState (injected per-request)
    graph.add_node(GraphNodeID.RETRIEVAL.value,                _make_debug_node(retrieval_node,              "retrieval_node"))
    graph.add_node(GraphNodeID.RERANK.value,                   _make_debug_node(rerank_node,                 "rerank_node"))
    graph.add_node(GraphNodeID.THRESHOLD_CHECK.value,          _make_debug_node(threshold_check_node,        "threshold_check_node"))
    graph.add_node(GraphNodeID.REWRITE.value,                  _make_debug_node(rewrite_node,                "rewrite_node"))
    graph.add_node(GraphNodeID.FINAL_RESPONSE_GENERATOR.value, _make_debug_node(generate_final_response_node,"generate_final_response_node"))
    graph.add_node(GraphNodeID.FALLBACK_NODE.value,            _make_debug_node(fallback_node,               "fallback_node"))
    graph.add_node(GraphNodeID.SECURITY_KILL_SWITCH.value,     _make_debug_node(security_kill_switch_node,   "security_kill_switch_node"))

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

    return graph.compile(checkpointer=checkpointer)
