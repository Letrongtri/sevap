from dataclasses import dataclass
from app.core.enum import AccessLevel

ACCESS_LEVEL_HIERARCHY = {
    AccessLevel.PUBLIC: 0,
    AccessLevel.PRIVATE: 1,
    AccessLevel.MANAGERIAL: 2
}


@dataclass
class PARContext:
    """
    Policy-Aware Retrieval Context.
    Chứa toàn bộ thông tin phân quyền của user để lọc tài liệu trong RAG pipeline.
    """
    user_id: str
    tenant_id: str
    role_access_level: str   # level cao nhất trong các role của user
    department_ids: list[str]
    role_ids: list[str]
    is_admin: bool = False

    def allowed_access_levels(self) -> list[str]:
        """Trả về tất cả access levels mà user này được phép đọc."""
        max_level = ACCESS_LEVEL_HIERARCHY.get(self.role_access_level, 0)
        return [
            level for level, rank in ACCESS_LEVEL_HIERARCHY.items()
            if rank <= max_level
        ]
