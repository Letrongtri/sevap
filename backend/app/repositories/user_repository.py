from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import delete, func, or_

from app.models import User, UserRole

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_employee_code(self, tenant_id: str, employee_code: str, 
                                        get_user_roles: bool = False, 
                                        get_user_department: bool = False, 
                                        get_user_job_title: bool = False,
                                        get_user_tenant: bool = False
    ):
        stmt = select(User).where(
            User.tenant_id == tenant_id, 
            User.employee_code == employee_code,
            User.is_deleted == False
        )

        if get_user_roles:
            stmt = stmt.options(selectinload(User.role_associations).selectinload(UserRole.role))
        if get_user_department:
            stmt = stmt.options(selectinload(User.department))
        if get_user_job_title:
            stmt = stmt.options(selectinload(User.job_title))
        if get_user_tenant:
            stmt = stmt.options(selectinload(User.tenant))

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, email: str, 
                                        get_user_roles: bool = False, 
                                        get_user_department: bool = False, 
                                        get_user_job_title: bool = False,
                                        get_user_tenant: bool = False
    ):
        stmt = select(User).where(User.email == email, User.is_deleted == False)

        if get_user_roles:
            stmt = stmt.options(selectinload(User.role_associations).selectinload(UserRole.role))
        if get_user_department:
            stmt = stmt.options(selectinload(User.department))
        if get_user_job_title:
            stmt = stmt.options(selectinload(User.job_title))
        if get_user_tenant:
            stmt = stmt.options(selectinload(User.tenant))

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    

    async def get_user_by_id(self, user_id: int, 
                             get_user_roles: bool = False,
                             get_user_department: bool = False,
                             get_user_job_title: bool = False,
                             get_user_tenant: bool = False
    ):
        stmt = select(User).where(User.id == user_id, User.is_deleted == False)

        if get_user_roles:
            stmt = stmt.options(selectinload(User.role_associations).selectinload(UserRole.role))
        if get_user_department:
            stmt = stmt.options(selectinload(User.department))
        if get_user_job_title:
            stmt = stmt.options(selectinload(User.job_title))
        if get_user_tenant:
            stmt = stmt.options(selectinload(User.tenant))
            
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    
    async def get_all_users(
        self, query: str | None = None, department_id: int | None = None, 
        role_id: int | None = None, job_title_id: int | None = None, 
        status: str | None = None, skip: int = 0, limit: int = 10
    ) -> tuple[list[User], int]:
        stmt = select(User).where(User.is_deleted == False)

        if query is not None:
            stmt = stmt.filter(
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.employee_code.ilike(f"%{query}%")
                )
            )
        if department_id is not None:
            stmt = stmt.where(User.department_id == department_id)
        if job_title_id is not None:
            stmt = stmt.where(User.job_title_id == job_title_id)
        if status is not None:
            if status.lower() == 'active':
                stmt = stmt.where(User.is_active == True)
            elif status.lower() == 'inactive':
                stmt = stmt.where(User.is_active == False)
            else:
                raise ValueError("Invalid status")

        if role_id is not None:
            stmt = stmt.join(User.role_associations).where(UserRole.role_id == role_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)
        
        stmt = stmt.options(
            joinedload(User.department),
            joinedload(User.job_title),
            selectinload(User.role_associations).joinedload(UserRole.role)
        )
        
        stmt = stmt.order_by(User.id.desc()).offset(skip).limit(limit)
        
        # 5. Thực thi truy vấn lấy dữ liệu
        result = await self.db.execute(stmt)
        # Dùng unique() vì có join với bảng nhiều-nhiều (UserRole)
        users = result.unique().scalars().all()

        return list(users), total_records

    async def get_user_options(
        self, query: str | None = None, skip: int = 0, limit: int = 10
    ) -> tuple[list[User], int]:
        stmt = select(User).where(User.is_deleted == False, User.is_active == True)

        if query is not None and query.strip() != '':
            stmt = stmt.filter(
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.employee_code.ilike(f"%{query}%")
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)

        stmt = stmt.order_by(User.full_name.asc()).offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        users = result.scalars().all()

        return list(users), total_records
    
    async def create_user(self, user: User, role_ids: list[int] | None = None):
        try:
            self.db.add(user)
            await self.db.flush()
            
            if role_ids:
                user_roles = []
                for role_id in role_ids:
                    user_roles.append(UserRole(user_id=user.id, role_id=role_id))
                self.db.add_all(user_roles)
            
            await self.db.commit()
            await self.db.refresh(user)
            
            stmt = select(User).where(User.id == user.id).options(
                joinedload(User.department),
                joinedload(User.job_title),
                selectinload(User.role_associations).joinedload(UserRole.role),
            )
            
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except IntegrityError as e:
            await self.db.rollback()
            raise ValueError("Email already exists")
        except Exception as e:
            await self.db.rollback()
            raise e

    async def update_user_roles(self, user_id: int, role_ids: list[int]):
        await self.db.execute(
            delete(UserRole).where(UserRole.user_id == user_id)
        )
        if role_ids:
            user_roles = [UserRole(user_id=user_id, role_id=role_id) for role_id in role_ids]
            self.db.add_all(user_roles)

    async def save(self, user: User):
        try:
            await self.db.commit()
            # NOTE: Do NOT call refresh() here — it expires all eager-loaded
            # relationships (role_associations, department, job_title), causing
            # MissingGreenlet errors when they are accessed after this call.
            # expire_on_commit=False in the session factory already handles this.
        except Exception as e:
            await self.db.rollback()
            raise e

    async def delete_user(self, user: User):
        try:
            user.is_deleted = True
            user.is_active = False
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
