from dataclasses import dataclass, field


@dataclass(frozen=True)
class UserSecurityContext:
    """
    Identity context — "Ai đang gọi hệ thống?"

    Được build một lần duy nhất tại tầng HTTP (middleware / API endpoint)
    từ JWT token hoặc session, sau đó truyền bất biến (frozen=True) xuyên
    suốt toàn bộ vòng đời request.

    Trách nhiệm:
        - Xác định danh tính người dùng (user_id, tenant_id).
        - Cung cấp thông tin cần thiết cho audit log (ip_address, session_id).
        - Không biết gì về quyền truy cập tài liệu — đó là việc của PARContext.

    Không chứa:
        - role_ids, department_ids, access_level  ← thuộc PARContext
        - Bất kỳ thông tin nào cần tra DB          ← phải tra tại PAR Filter
    """
    user_id: str
    tenant_id: str
    is_admin: bool = False
    session_id: str | None = None
    ip_address: str | None = None
