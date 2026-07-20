from typing import Optional
from pydantic import ValidationError
from fastapi import (
    APIRouter, Query, status,
    WebSocket, WebSocketDisconnect
)

from app.core.enum import PermissionResource, PermissionAction, SortOrder, DefaultRole
from app.core.logging import logger
from app.services import ActivityLogService, log_socket_manager, UserSessionService
from app.schemas import ActivityLogQuery, PaginationQuery, UserSessionAdminQuery
from app.repositories import ActivityLogRepository, UserSessionRepository
from app.db.session import AsyncSessionLocal
from app.utils.auth import verify_token

router = APIRouter()


async def _get_logs(tenant_id: str, query: ActivityLogQuery, pagination: PaginationQuery):
    """Tạo session riêng, query xong đóng ngay — không giữ connection suốt vòng đời WS."""
    async with AsyncSessionLocal() as db:
        repo = ActivityLogRepository(db)
        service = ActivityLogService(repo)
        return await service.get_all_activity_logs(
            tenant_id=tenant_id,
            query=query,
            pagination=pagination,
        )


async def _get_user_sessions(
    tenant_id: str,
    current_user_id: str,
    query: UserSessionAdminQuery,
    pagination: PaginationQuery,
):
    """Tạo session riêng, query xong đóng ngay — không giữ connection suốt vòng đời WS."""
    async with AsyncSessionLocal() as db:
        repo = UserSessionRepository(db)
        service = UserSessionService(repo)
        return await service.get_tenant_user_sessions(
            tenant_id=tenant_id,
            current_user_id=current_user_id,
            query=query,
            pagination=pagination,
        )


@router.websocket("/tenant-logs")
async def tenant_activity_logs_ws(
    websocket: WebSocket,
    token: str = Query(...),
    # Filters được đọc từ query params ngay lúc connect
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=15, ge=1, le=100),
    sort_order: Optional[str] = Query(default="desc"),
    action: Optional[str] = Query(default=None),
    resource: Optional[str] = Query(default=None),
    log_level: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
):
    """Retrieve activity logs and stream new events. Only accessible to tenant administrators."""

    # ── Step 1: Accept TRƯỚC rồi mới reject ──────────────────────────────────
    # Nếu close() trước accept(), FastAPI trả về 403 HTTP thay vì WS 1008.
    await websocket.accept()

    # ── Step 2: Xác thực token ────────────────────────────────────────────────
    try:
        payload = verify_token(token)
    except Exception:
        payload = None

    if not payload:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Invalid token"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id_from_token = payload.get("sub")
    jti = payload.get("jti")
    permissions = payload.get("permissions", [])
    tenant_id = payload.get("tenant_id")
    is_global_admin = payload.get("is_global_admin", False)

    # Endpoint này chỉ dành cho tenant admin, KHÔNG phải global admin
    if not user_id_from_token or not jti or not tenant_id or is_global_admin:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Access denied"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── Step 3: Kiểm tra permission ───────────────────────────────────────────
    required_perm = f"{PermissionResource.ACTIVITY_LOGS.value}:{PermissionAction.READ.value}"
    if required_perm not in permissions:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Insufficient permissions"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── Step 4: Đăng ký kết nối ──────────────────────────────────────────────
    await log_socket_manager.connect(websocket, tenant_id)

    # ── Step 5: Build filters từ query params và gửi HISTORY_LOADED ngay ─────
    try:
        initial_query = ActivityLogQuery(
            action=action,
            resource=resource,
            log_level=log_level,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            sort_order=SortOrder(sort_order) if sort_order else SortOrder.DESC,
        )
        initial_pagination = PaginationQuery(page=page, limit=limit)

        log_socket_manager.update_filters(websocket, initial_query, initial_pagination)

        # Tạo session ngắn hạn chỉ để load lịch sử — đóng ngay sau khi xong
        res = await _get_logs(tenant_id, initial_query, initial_pagination)

        await websocket.send_json({
            "status": "success",
            "event": "HISTORY_LOADED",
            "data": res.model_dump(mode='json') if hasattr(res, "model_dump") else res.dict(),
        })
    except Exception:
        logger.error("ws_initial_load_failed", tenant_id=tenant_id, exc_info=True)
        await websocket.send_json({"status": "error", "event": "error", "detail": "Failed to load initial logs"})

    # ── Step 6: Lắng nghe filter updates từ client (tùy chọn) ────────────────
    try:
        while True:
            client_data = await websocket.receive_json()

            try:
                query_data = client_data.get("query", {})
                pagination_data = client_data.get("pagination", {})

                query = ActivityLogQuery(**query_data)
                pagination = PaginationQuery(**pagination_data)

                log_socket_manager.update_filters(websocket, query, pagination)

            except ValidationError as val_err:
                await websocket.send_json({
                    "status": "error",
                    "event": "error",
                    "detail": "Invalid query parameters",
                    "errors": val_err.errors(),
                })
                continue

            try:
                # Tạo session ngắn hạn cho mỗi lần query — đóng ngay sau khi xong
                res = await _get_logs(tenant_id, query, pagination)
                await websocket.send_json({
                    "status": "success",
                    "event": "HISTORY_LOADED",
                    "data": res.model_dump(mode='json') if hasattr(res, "model_dump") else res.dict(),
                })
            except Exception:
                logger.error("ws_get_activity_logs_failed", tenant_id=tenant_id, exc_info=True)
                await websocket.send_json({
                    "status": "error",
                    "event": "error",
                    "detail": "Failed to retrieve activity logs",
                })

    except WebSocketDisconnect:
        log_socket_manager.disconnect(websocket)
        logger.info(f"Client ngắt kết nối log socket. Tenant: {tenant_id}")


@router.websocket("/user-sessions")
async def get_tenant_user_sessions_ws(
    websocket: WebSocket,
    token: str = Query(...),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=15, ge=1, le=100),
    user_id: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
):
    """Retrieve tenant user sessions over WebSocket. Only accessible to tenant administrators."""

    # ── Step 1: Accept TRƯỚC rồi mới reject ──────────────────────────────────
    await websocket.accept()

    # ── Step 2: Xác thực token ────────────────────────────────────────────────
    try:
        payload = verify_token(token)
    except Exception:
        payload = None

    if not payload:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Invalid token"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id_from_token = payload.get("sub")
    jti = payload.get("jti")
    roles = payload.get("roles", [])
    permissions = payload.get("permissions", [])
    tenant_id = payload.get("tenant_id")
    is_global_admin = payload.get("is_global_admin", False)

    # Endpoint này chỉ dành cho tenant admin, KHÔNG phải global admin
    if not user_id_from_token or not jti or not tenant_id or is_global_admin:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Access denied"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── Step 3: Kiểm tra role / permission ───────────────────────────────────
    required_perm = f"{PermissionResource.USERS.value}:{PermissionAction.READ.value}"
    if DefaultRole.ADMIN.value not in roles and "admin" not in roles and required_perm not in permissions:
        await websocket.send_json({"status": "error", "event": "error", "detail": "Insufficient permissions"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── Step 4: Build filters từ query params và gửi HISTORY_LOADED ngay ─────
    try:
        initial_query = UserSessionAdminQuery(
            user_id=user_id,
            status=status_filter,
        )
        initial_pagination = PaginationQuery(page=page, limit=limit)

        res = await _get_user_sessions(
            tenant_id=tenant_id,
            current_user_id=user_id_from_token,
            query=initial_query,
            pagination=initial_pagination,
        )

        await websocket.send_json({
            "status": "success",
            "event": "HISTORY_LOADED",
            "data": res.model_dump(mode='json') if hasattr(res, "model_dump") else res.dict(),
        })
    except Exception:
        logger.error("ws_initial_user_sessions_failed", tenant_id=tenant_id, exc_info=True)
        await websocket.send_json({"status": "error", "event": "error", "detail": "Failed to load initial user sessions"})

    # ── Step 5: Lắng nghe filter updates từ client ───────────────────────────
    try:
        while True:
            client_data = await websocket.receive_json()

            try:
                query_data = client_data.get("query", {})
                pagination_data = client_data.get("pagination", {})

                query = UserSessionAdminQuery(**query_data)
                pagination = PaginationQuery(**pagination_data)

            except ValidationError as val_err:
                await websocket.send_json({
                    "status": "error",
                    "event": "error",
                    "detail": "Invalid query parameters",
                    "errors": val_err.errors(),
                })
                continue

            try:
                res = await _get_user_sessions(
                    tenant_id=tenant_id,
                    current_user_id=user_id_from_token,
                    query=query,
                    pagination=pagination,
                )
                await websocket.send_json({
                    "status": "success",
                    "event": "HISTORY_LOADED",
                    "data": res.model_dump(mode='json') if hasattr(res, "model_dump") else res.dict(),
                })
            except Exception:
                logger.error("ws_get_user_sessions_failed", tenant_id=tenant_id, exc_info=True)
                await websocket.send_json({
                    "status": "error",
                    "event": "error",
                    "detail": "Failed to retrieve user sessions",
                })

    except WebSocketDisconnect:
        logger.info(f"Client ngắt kết nối user sessions socket. Tenant: {tenant_id}")

