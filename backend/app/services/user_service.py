from app.schemas import UserUpdate
import math

from app.models import User
from app.repositories import UserRepository
from app.schemas import (
    UserCreate, RoleSimple, PaginationQuery, UserQuery, 
    UserResponse, UserPaginatedResponse, PaginationResponse
)
from app.services.exceptions import (
    UserAlreadyExistsError, 
    NotFoundError,
    InvalidPasswordError
)
from app.core.config import settings
from app.utils.auth import hash_password, verify_password

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, data: UserCreate) -> UserResponse:
        existing = await self.repo.get_user_by_employee_code(data.employee_code)
        if existing is not None:
            raise UserAlreadyExistsError()
        
        hashed_password = hash_password(data.password)
        
        db_user = User(
            employee_code=data.employee_code, 
            full_name=data.full_name, 
            email=data.email, 
            password=hashed_password,
            department_id=data.department_id,
            job_title_id=data.job_title_id
        )

        user = await self.repo.create_user(user=db_user, role_ids=data.role_ids)
        
        # Mapping dữ liệu từ SQLAlchemy Model sang Pydantic Schema
        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=user.id,
            employee_code=user.employee_code,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            is_deleted=user.is_deleted,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            job_title_id=user.job_title_id,
            department_id=user.department_id,
            job_title=user.job_title,
            department=user.department,
            roles=roles
        )

        return user_resp
    
    async def get_user_by_id(self, user_id: int) -> UserResponse:
        user = await self.repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )
        if user is None:
            raise NotFoundError()
        
        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=user.id,
            employee_code=user.employee_code,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            is_deleted=user.is_deleted,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            job_title_id=user.job_title_id,
            department_id=user.department_id,
            job_title=user.job_title,
            department=user.department,
            roles=roles
        )

        return user_resp

    
    async def get_all_users(self, query: UserQuery, 
        pagination: PaginationQuery
    ) -> UserPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        users_data, total_records = await self.repo.get_all_users(
            query=query.query,
            job_title_id=query.job_title_id,
            department_id=query.department_id,
            role_id=query.role_id,
            status=query.status,
            skip=skip,
            limit=pagination.limit
        )

        # 3. Tính toán tổng số trang
        total_pages = math.ceil(total_records / pagination.limit) if total_records > 0 else 0

        # 4. Mapping dữ liệu từ SQLAlchemy Model sang Pydantic Schema
        user_responses = []
        for user in users_data:
            # Lấy danh sách role
            roles = []
            if user.role_associations and len(user.role_associations) > 0:
                for role_association in user.role_associations:
                    roles.append(RoleSimple.model_validate(role_association.role))

            # Tạo object UserResponse
            user_resp = UserResponse(
                id=user.id,
                employee_code=user.employee_code,
                full_name=user.full_name,
                email=user.email,
                is_active=user.is_active,
                is_deleted=user.is_deleted,
                last_login=user.last_login,
                created_at=user.created_at,
                updated_at=user.updated_at,
                job_title_id=user.job_title_id,
                department_id=user.department_id,
                job_title=user.job_title,
                department=user.department,
                roles=roles
            )
            user_responses.append(user_resp)

        # 5. Đóng gói kết quả trả về
        return UserPaginatedResponse(
            users=user_responses,
            pagination=PaginationResponse(
                total=total_records,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )

    async def update_user(self, user_id: int, data: UserUpdate) -> UserResponse:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        if data.full_name is not None:
            existing.full_name = data.full_name
        if data.email is not None:
            if existing.email != data.email:
                existing_by_email = await self.repo.get_user_by_email(data.email)
                if existing_by_email is not None:
                    raise UserAlreadyExistsError()
            existing.email = data.email
        if data.job_title_id is not None:
            existing.job_title_id = data.job_title_id
        if data.department_id is not None:
            existing.department_id = data.department_id

        # Update roles if provided
        if data.role_ids is not None:
            await self.repo.update_user_roles(user_id, data.role_ids)

        await self.repo.save(user=existing)

        # Reload user to get updated relationships
        updated_user = await self.repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )

        # Map to response schema
        roles = []
        if updated_user.role_associations and len(updated_user.role_associations) > 0:
            for role_association in updated_user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=updated_user.id,
            employee_code=updated_user.employee_code,
            full_name=updated_user.full_name,
            email=updated_user.email,
            is_active=updated_user.is_active,
            is_deleted=updated_user.is_deleted,
            last_login=updated_user.last_login,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
            job_title_id=updated_user.job_title_id,
            department_id=updated_user.department_id,
            job_title=updated_user.job_title,
            department=updated_user.department,
            roles=roles
        )

        return user_resp

    async def toggle_user_status(self, user_id: int, active: bool) -> UserResponse:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        existing.is_active = active
        await self.repo.save(user=existing)

        # Reload user to get updated relationships
        updated_user = await self.repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )

        # Map to response schema
        roles = []
        if updated_user.role_associations and len(updated_user.role_associations) > 0:
            for role_association in updated_user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=updated_user.id,
            employee_code=updated_user.employee_code,
            full_name=updated_user.full_name,
            email=updated_user.email,
            is_active=updated_user.is_active,
            is_deleted=updated_user.is_deleted,
            last_login=updated_user.last_login,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
            job_title_id=updated_user.job_title_id,
            department_id=updated_user.department_id,
            job_title=updated_user.job_title,
            department=updated_user.department,
            roles=roles
        )

        return user_resp
    
    async def delete_user(self, user_id: int) -> UserResponse:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        user_resp = UserResponse(
            id=existing.id,
            employee_code=existing.employee_code,
            full_name=existing.full_name,
            email=existing.email,
            is_active=existing.is_active,
            is_deleted=existing.is_deleted,
            last_login=existing.last_login,
            created_at=existing.created_at,
            updated_at=existing.updated_at,
            job_title_id=existing.job_title_id,
            department_id=existing.department_id,
            job_title=None,
            department=None,
            roles=None
        )
        
        await self.repo.delete_user(existing)
        return user_resp

    async def reset_user_password(self, user_id: int) -> UserResponse:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        default_password = settings.DEFAULT_USER_PASSWORD
        existing.password = hash_password(default_password)
        await self.repo.save(user=existing)

        # Reload user to get updated relationships
        user = await self.repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )

        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=user.id,
            employee_code=user.employee_code,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            is_deleted=user.is_deleted,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            job_title_id=user.job_title_id,
            department_id=user.department_id,
            job_title=user.job_title,
            department=user.department,
            roles=roles
        )
        return user_resp
    
    async def change_user_password(self, user_id: int, old_password: str, new_password: str) -> UserResponse:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        if not verify_password(old_password, existing.password):
            raise InvalidPasswordError()
        
        existing.password = hash_password(new_password)
        await self.repo.save(user=existing)

        # Reload user to get updated relationships
        user = await self.repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )

        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        user_resp = UserResponse(
            id=user.id,
            employee_code=user.employee_code,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            is_deleted=user.is_deleted,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            job_title_id=user.job_title_id,
            department_id=user.department_id,
            job_title=user.job_title,
            department=user.department,
            roles=roles
        )
        return user_resp

