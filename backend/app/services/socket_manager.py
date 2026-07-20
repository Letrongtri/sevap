import asyncio
from typing import Dict, Any
from fastapi import WebSocket
from starlette.websockets import WebSocketState

class LogConnectionManager:
    def __init__(self):
        # Lưu kết nối theo cấu trúc: { websocket: { "tenant_id": "...", "query": ..., "pagination": ... } }
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        # websocket.accept() đã được gọi trước trong endpoint handler
        self.active_connections[websocket] = {
            "tenant_id": tenant_id,
            "query": None,
            "pagination": None
        }

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    def update_filters(self, websocket: WebSocket, query: Any, pagination: Any):
        """Cập nhật bộ lọc mới nhất mà Client gửi lên từ màn hình dashboard"""
        if websocket in self.active_connections:
            self.active_connections[websocket]["query"] = query
            self.active_connections[websocket]["pagination"] = pagination

    async def broadcast_new_log(self, tenant_id: str, new_log: Any):
        """
        Hàm push realtime: Kích hoạt khi có một log mới được ghi vào DB.
        Đẩy dữ liệu tới ĐÚNG các admin thuộc tenant đó và thỏa mãn bộ lọc (nếu có).
        """

        payload = {
            "status": "realtime_push",
            "event": "NEW_ACTIVITY_LOG",
            "data": new_log.model_dump(mode="json") if hasattr(new_log, "model_dump") else new_log.dict()
        }

        # Snapshot danh sách để tránh thay đổi dict trong khi iterate
        connections = list(self.active_connections.items())
        tasks: list[tuple[Any, Any]] = []

        for ws, client_info in connections:
            # 1. Bỏ qua nếu không cùng tenant
            if client_info["tenant_id"] != tenant_id:
                continue

            # 2. Bỏ qua nếu WebSocket đã đóng/đang đóng
            if ws.client_state != WebSocketState.CONNECTED:
                self.disconnect(ws)
                continue

            # 3. Kiểm tra filter của client (nếu có)
            query = client_info["query"]
            if query:
                if hasattr(query, "resource") and query.resource and query.resource != new_log.resource:
                    continue
                if hasattr(query, "action") and query.action and query.action != new_log.action:
                    continue
                if hasattr(query, "log_level") and query.log_level and query.log_level != new_log.log_level:
                    continue
                if hasattr(query, "user_id") and query.user_id and query.user_id != new_log.user_id:
                    continue

            tasks.append((ws, ws.send_json(payload)))

        if tasks:
            results = await asyncio.gather(
                *[coro for _, coro in tasks], return_exceptions=True
            )
            # Dọn dẹp các connection bị lỗi khi gửi
            for (ws, _), result in zip(tasks, results):
                if isinstance(result, Exception):
                    self.disconnect(ws)

# Khởi tạo instance dùng chung toàn hệ thống
log_socket_manager = LogConnectionManager()