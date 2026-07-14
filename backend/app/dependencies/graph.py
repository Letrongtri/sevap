"""
Graph Dependency Injection — FastAPI Production.

Cung cấp CompiledStateGraph từ app.state (được khởi tạo trong lifespan).

Nguyên tắc thiết kế:
  - CompiledStateGraph được compile MỘT LẦN trong lifespan() và lưu vào app.state.
  - RetrievalService là per-request (giữ AsyncSession) → inject riêng tại tầng node.
  - AsyncPostgresSaver (checkpointer) được quản lý bởi lifespan context manager
    → tự đóng connection pool khi app shutdown.

Cách dùng trong endpoint:
    from fastapi import Depends
    from app.dependencies import get_compiled_graph

    async def my_endpoint(graph = Depends(get_compiled_graph)):
        result = await graph.ainvoke(...)
"""

from fastapi import Request
from langgraph.graph.state import CompiledStateGraph


def get_compiled_graph(request: Request) -> CompiledStateGraph:
    """
    FastAPI Dependency — trả về CompiledStateGraph từ app.state.

    Graph được compile sẵn trong lifespan() với AsyncPostgresSaver.
    Mỗi request dùng chung 1 graph instance (stateless) nhưng
    mỗi conversation có thread_id riêng biệt → state isolated.
    """
    return request.app.state.compiled_graph
