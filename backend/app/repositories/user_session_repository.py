from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_, case, literal

from app.models import UserSession, User, UserRole, Role

class UserSessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user_session(self, user_session: UserSession):
        try:
            self.db.add(user_session)
            await self.db.commit()
            await self.db.refresh(user_session)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def save(self, user_session: UserSession):
        try:
            await self.db.commit()
            # NOTE: No refresh() — see user_repository.py save() for explanation.
        except Exception as e:
            await self.db.rollback()
            raise e
    
    async def get_user_session_by_jti(self, jti: str):
        stmt = select(UserSession).where(UserSession.jti == jti)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_session(
        self, 
        session_id: str,
        tenant_id: str | None = None,
        user_id: str | None = None
    ):
        stmt = select(UserSession).where(UserSession.id == session_id)
        
        if tenant_id:
            stmt = stmt.where(UserSession.tenant_id == tenant_id)
        if user_id:
            stmt = stmt.where(UserSession.user_id == user_id)
            
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_sessions(
        self, user_id: str, skip: int, limit: int,
        tenant_id: str | None = None
    ) -> tuple[list[UserSession], int]:
        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.tenant_id == tenant_id
        )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt) or 0

        stmt = (
            stmt.order_by(UserSession.id.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return result.scalars().all(), total_records

    async def get_tenant_user_sessions(
        self,
        tenant_id: str,
        current_user_id: str,
        user_id: str | None,
        status: str | None,
        skip: int,
        limit: int
    ) -> tuple[list[tuple], int]:
        """
        Truy vấn toàn bộ siêu dữ liệu phiên làm việc, thông tin nhân viên và vai trò liên quan.
        Áp dụng Aggregate function string_agg của Postgres để nén danh sách quyền hạn gọn vào 1 single query.
        """
        now_utc = datetime.now(timezone.utc)

        # 1. Xây dựng mệnh đề lọc động (Dynamic Where Clauses)
        where_conditions = [
            UserSession.tenant_id == tenant_id,
            UserSession.user_id != current_user_id
        ]

        if user_id is not None:
            where_conditions.append(UserSession.user_id == user_id)

        if status == "active":
            where_conditions.append(
                and_(
                    UserSession.revoked_at.is_(None),
                    UserSession.expires_at >= now_utc
                )
            )
        elif status == "inactive":
            where_conditions.append(
                or_(
                    UserSession.revoked_at.is_not(None),
                    UserSession.expires_at < now_utc
                )
            )

        # 2. Tạo Subquery để tính tổng số bản ghi (Phục vụ phân trang chính xác)
        count_stmt = select(func.count(UserSession.id)).where(and_(*where_conditions))
        total_records = await self.db.scalar(count_stmt) or 0

        if total_records == 0:
            return [], 0

        # 3. Luồng SQL Core: Kết hợp JOIN 4 tầng phẳng và Gom nhóm chuỗi văn bản (Aggregation)
        # string_agg biến danh sách Roles của User từ dạng nhiều dòng thành chuỗi "admin, hr_manager"
        roles_agg = func.string_agg(Role.name, literal(", ")).label("roles_list")

        # Xác định trạng thái logic của phiên (Computed Status)
        status_case = case(
            (UserSession.revoked_at.is_not(None), "revoked"),
            (UserSession.expires_at < now_utc, "expired"),
            else_="active"
        ).label("computed_status")

        is_revoked = (UserSession.revoked_at.is_not(None)).label("is_revoked")

        stmt = (
            select(
                UserSession.id,
                UserSession.user_id,
                User.full_name,
                User.email,
                roles_agg,
                UserSession.tenant_id,
                UserSession.ip_address,
                UserSession.user_agent,
                status_case,
                is_revoked
            )
            .join(User, UserSession.user_id == User.id)
            .join(UserRole, User.id == UserRole.user_id, isouter=True)
            .join(Role, UserRole.role_id == Role.id, isouter=True)
            .where(and_(*where_conditions))
            .group_by(
                UserSession.id,
                UserSession.user_id,
                User.full_name,
                User.email,
                UserSession.tenant_id,
                UserSession.ip_address,
                UserSession.user_agent,
                UserSession.expires_at,
                UserSession.revoked_at
            )
            .order_by(UserSession.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return result.all(), total_records
