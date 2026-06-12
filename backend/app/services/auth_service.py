from datetime import datetime, timezone

from app.repositories import UserRepository, UserSessionRepository
from app.services import (
    InvalidCredentialsError,
    InvalidTokenError, 
    NotFoundError,
)
from app.models import User, UserSession
from app.utils.auth import create_access_token, create_refresh_token, verify_password, verify_token
from app.core.logging import logger

class AuthService:
    def __init__(self, user_repo: UserRepository, session_repo: UserSessionRepository):
        self.user_repo = user_repo
        self.session_repo = session_repo

    async def login(self, employee_code: str, password: str, client_ip: str | None = None) -> User:
        user = await self.user_repo.get_user_by_employee_code(
            employee_code, get_user_roles=True, 
            get_user_department=True, 
            get_user_job_title=True
            )
        if not user or not verify_password(password, user.password):
            raise InvalidCredentialsError()
        
        user_roles = []
        for role in user.role_associations:
            user_roles.append(role.role.name)
        
        access_token = create_access_token(str(user.id), user_roles)
        refresh_token = create_refresh_token(str(user.id))

        user_session = UserSession(
            user_id=user.id,
            jti=refresh_token.jti,
            ip_address=client_ip,
            expires_at=refresh_token.expires_at
        )

        user.last_login = datetime.now(timezone.utc)
        await self.user_repo.save(user)
        await self.session_repo.create_user_session(user_session)

        logger.info(
            "login_success",
            employee_code=employee_code,
            client_ip=client_ip
        )
        
        return user, access_token, refresh_token

    async def refresh_token(self, refresh_token: str):
        token_payload = verify_token(refresh_token)

        session = await self.session_repo.get_user_session_by_jti(token_payload["jti"])

        if not session or session.revoked_at is not None or session.expires_at < datetime.now(timezone.utc):
            raise InvalidTokenError()
        
        user = await self.user_repo.get_user_by_id(session.user_id, get_user_roles=True)
        if not user or user.is_deleted:
            raise NotFoundError()
        
        roles = []
        for role in user.role_associations:
            roles.append(role.role.name)
        
        new_access_token = create_access_token(user_id=str(session.user_id), user_roles=roles)

        return new_access_token
        
    async def logout(self, refresh_token: str):
        token_payload = verify_token(refresh_token)

        session = await self.session_repo.get_user_session_by_jti(token_payload["jti"])
        if session is None or session.revoked_at is not None or session.expires_at < datetime.now(timezone.utc):
            return
        
        session.revoked_at = datetime.now(timezone.utc)
        
        await self.session_repo.save(session)

    async def get_current_user(self, user_id: int):
        # Verify user exists in database
        user = await self.user_repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True
        )
        if user is None:
            raise NotFoundError()

        from app.schemas import UserResponse, RoleSimple
        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        return UserResponse(
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

