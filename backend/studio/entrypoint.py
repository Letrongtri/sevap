"""
LangSmith Studio / langgraph dev — Entrypoint.

File này được `langgraph.json` reference TRỰC TIẾP.
KHÔNG BAO GIỜ import file này vào production FastAPI code.

QUAN TRỌNG: KHÔNG truyền checkpointer vào build_hr_graph() ở đây.
LangGraph API (langgraph dev / LangSmith Cloud) tự quản lý persistence —
truyền checkpointer sẽ gây GraphLoadError.

RetrievalService được inject vào AgentState per-request khi invoke graph,
không cần truyền lúc compile — do đó không cần stub ở đây.
"""

from langgraph.graph.state import CompiledStateGraph

from app.ai_brain.graph.hr_graph import build_hr_graph


# ── Top-level variable required by langgraph.json ─────────────────────────────
# langgraph.json: { "hr_graph": "./studio/entrypoint.py:hr_graph" }
# checkpointer=None → LangGraph Platform tự inject persistence
# retrieval_service=None → inject per-request qua AgentState khi invoke
hr_graph: CompiledStateGraph = build_hr_graph(checkpointer=None)
