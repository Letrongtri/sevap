from dataclasses import dataclass
from app.core.enum import AccessLevel

ACCESS_LEVEL_HIERARCHY = {
    AccessLevel.PUBLIC: 0,
    AccessLevel.PRIVATE: 1,
    AccessLevel.MANAGERIAL: 2
}


@dataclass(frozen=True)
class PARContext:
    """
    Policy-Aware Retrieval Context — "User này được đọc tài liệu nào?"

    Được build từ DB lookup (PARRepository.build_par_context) dựa trên
    UserSecurityContext. Chỉ tồn tại và có ý nghĩa bên trong AI brain /
    retrieval pipeline.

    Trách nhiệm:
        - Cung cấp boundary inject vào SQL query (tenant_id, allowed doc IDs).
        - Xác định access level cao nhất của user để lọc theo cấp độ tài liệu.
        - Cung cấp role_ids / department_ids cho Explicit Grant lookup.
        - Giữ user_id để kiểm tra uploader ownership (PRIVATE branch).

    Không chứa:
        - ip_address, session_id   ← thuộc UserSecurityContext (audit layer)
        - is_admin                 ← chỉ dùng ở HTTP layer, không phải retrieval
    """
    tenant_id: str
    user_id: str                    # dùng để check Document.uploader_id (PRIVATE branch)
    role_access_level: str          # access level cao nhất trong các role của user
    role_ids: list[str]
    department_ids: list[str]

    def allowed_access_levels(self) -> list[str]:
        """Trả về tất cả access levels mà user này được phép đọc."""
        max_level = ACCESS_LEVEL_HIERARCHY.get(self.role_access_level, 0)
        return [
            level for level, rank in ACCESS_LEVEL_HIERARCHY.items()
            if rank <= max_level
        ]
