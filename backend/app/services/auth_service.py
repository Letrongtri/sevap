from datetime import datetime, timezone, UTC
from fastapi import BackgroundTasks

from app.repositories import UserRepository, UserSessionRepository, TenantRepository
from app.services import (
    InvalidCredentialsError,
    InvalidTokenError, 
    NotFoundError,
)
from app.models import UserSession
from app.utils.auth import (
    create_access_token, create_refresh_token,
    verify_password, verify_token, generate_jti
)
from app.core.enum import LogLevel, DefaultRole
from app.core.logging import logger
from app.schemas import (
    UserResponse, RoleSimple, UserInfoResponse, LoginResponse, 
    RefreshTokenResponse, RefreshTokenRequest, TenantSimple
)
from app.services.activity_log_service import ActivityLogService

class AuthService:
    def __init__(
        self, 
        user_repo: UserRepository, 
        session_repo: UserSessionRepository, 
        tenant_repo: TenantRepository
    ):
        self.user_repo = user_repo
        self.session_repo = session_repo
        self.tenant_repo = tenant_repo

    async def login(
        self, employee_code: str, 
        password: str, background_tasks: BackgroundTasks, 
        client_ip: str | None = None,
        raw_user_agent: str | None = None,
        tenant_domain: str | None = None
    ) -> LoginResponse:
        is_global_admin = False
        if tenant_domain is None:
            user = await self.user_repo.get_user_by_employee_code(
                employee_code, get_user_roles=True
            )
            if user and DefaultRole.GLOBAL_ADMIN.value in [
                role.role.name 
                for role in user.role_associations
            ]:
                is_global_admin = True
            else:
                raise InvalidCredentialsError()
            
        else:
            tenant = await self.tenant_repo.get_tenant_by_domain(tenant_domain)
            if not tenant:
                raise NotFoundError("Tenant not found")

            user = await self.user_repo.get_user_by_employee_code(
                employee_code, tenant_id=tenant.id,
                get_user_roles=True, 
                get_user_department=True, 
                get_user_job_title=True,
                get_user_tenant=True
            )

        if not user or not verify_password(password, user.password):
            ActivityLogService.log(
                background_tasks=None,
                user_id=None,
                tenant_id=tenant.id if tenant else None,
                action="user.login_failed",
                resource="auth",
                meta_data={
                    "employee_code": employee_code,
                    "tenant_domain": tenant_domain if tenant_domain else "Global Admin"
                },
                ip_address=client_ip,
                log_level=LogLevel.WARNING
            )
            raise InvalidCredentialsError()
        
        user_roles = []
        user_permissions = []
        for role_assoc in user.role_associations:
            role = role_assoc.role
            user_roles.append(role.name)
            for perm in role.permissions:
                user_permissions.append(f"{perm.resource}:{perm.action}")

        jti = generate_jti()  # Add unique token identifier
        
        access_token = create_access_token(
            user_id=str(user.id), 
            jti=jti, 
            user_roles=user_roles,
            tenant_id=user.tenant_id, 
            is_global_admin=is_global_admin,
            permissions=user_permissions
        )
        refresh_token = create_refresh_token(
            user_id=str(user.id),
            jti=jti,
            tenant_id=user.tenant_id,
            is_global_admin=is_global_admin
        )

        user_session = UserSession(
            user_id=user.id,
            tenant_id=user.tenant_id,
            jti=jti,
            ip_address=client_ip,
            user_agent=raw_user_agent,
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
        
        ActivityLogService.log(
            background_tasks=background_tasks,
            user_id=user.id,
            tenant_id=user.tenant_id,
            action="user.login",
            resource="auth",
            meta_data={
                "employee_code": employee_code,
                "tenant_domain": tenant_domain if tenant_domain else "Global Admin"
            },
            ip_address=client_ip,
            log_level=LogLevel.INFO
        )

        user_roles = []
        for role in user.role_associations:
            user_roles.append(role.role.name)
        
        user_info = UserInfoResponse(
            id=user.id,
            full_name=user.full_name,
            employee_code=user.employee_code,
            roles=user_roles,
            permissions=user_permissions,
            department=user.department.name if user.department else "",
            job_title=user.job_title.title_name if user.job_title else "",
            tenant_id=user.tenant_id if user.tenant else "",
            tenant_domain=user.tenant.tenant_domain if user.tenant else "",
            company_name=user.tenant.company_name if user.tenant else "",
            last_login=user.last_login,
            is_global_admin=is_global_admin
        )

        return LoginResponse(
            token_type="bearer", 
            access_token=access_token.token, 
            access_token_expires_at=access_token.expires_at,
            refresh_token=refresh_token.token,
            refresh_token_expires_at=refresh_token.expires_at,
            user=user_info
        )

    async def refresh_token(self, data: RefreshTokenRequest) -> RefreshTokenResponse:
        token_payload = verify_token(data.refresh_token)
        if not token_payload:
            raise InvalidTokenError()

        jti = token_payload["jti"]
        tenant_id = token_payload["tenant_id"]
        is_global_admin = token_payload["is_global_admin"]

        if tenant_id is None and is_global_admin is not True:
            raise InvalidTokenError()

        session = await self.session_repo.get_user_session_by_jti(jti)

        if not session or session.revoked_at is not None or session.expires_at < datetime.now(timezone.utc):
            raise InvalidTokenError()
        
        user = await self.user_repo.get_user_by_id(session.user_id, get_user_roles=True)
        if not user or user.is_deleted:
            raise NotFoundError()

        db_is_global_admin = DefaultRole.GLOBAL_ADMIN.value in [
            role_assoc.role.name for role_assoc in user.role_associations if role_assoc.role
        ]

        if token_payload.get("is_global_admin") != db_is_global_admin:
            raise InvalidTokenError()

        if token_payload.get("tenant_id") != user.tenant_id:
            raise InvalidTokenError()
        
        user_roles = []
        user_permissions = []
        for role_assoc in user.role_associations:
            role = role_assoc.role
            user_roles.append(role.name)
            for perm in role.permissions:
                user_permissions.append(f"{perm.resource}:{perm.action}")
        
        is_global_admin = False
        if DefaultRole.GLOBAL_ADMIN.value in user_roles:
            is_global_admin = True

        new_jti = generate_jti()
        session.jti = new_jti
        await self.session_repo.save(session)
        
        new_access_token = create_access_token(
            user_id=session.user_id, 
            tenant_id=user.tenant_id,
            jti=new_jti,
            user_roles=user_roles,
            is_global_admin=is_global_admin,
            permissions=user_permissions
        )

        new_refresh_token = create_refresh_token(
            user_id=session.user_id,
            tenant_id=user.tenant_id,
            is_global_admin=is_global_admin,
            jti=new_jti
        )

        return RefreshTokenResponse(
            access_token=new_access_token.token,
            access_token_expires_at=new_access_token.expires_at,
            refresh_token=new_refresh_token.token,
            token_type="bearer"
        )
        
    async def logout(
        self, refresh_token: str, 
        user_id: str, tenant_id: str, 
        client_ip: str | None = None, 
        background_tasks: BackgroundTasks = None
    ):
        token_payload = verify_token(refresh_token)

        session = await self.session_repo.get_user_session_by_jti(token_payload["jti"])
        if session is None or session.revoked_at is not None or session.expires_at < datetime.now(timezone.utc):
            return
        
        session.revoked_at = datetime.now(timezone.utc)
        
        await self.session_repo.save(session)

        ActivityLogService.log(
            background_tasks=background_tasks,
            user_id=user_id,
            tenant_id=tenant_id,
            action="user.logout",
            resource="auth",
            ip_address=client_ip
        )
        
        return {"message": "Logout successful"}

    async def get_current_user(self, user_id: str):
        # Verify user exists in database
        user = await self.user_repo.get_user_by_id(
            user_id,
            get_user_roles=True,
            get_user_department=True,
            get_user_job_title=True,
            get_user_tenant=True
        )
        if user is None:
            raise NotFoundError()

        roles = []
        if user.role_associations and len(user.role_associations) > 0:
            for role_association in user.role_associations:
                roles.append(RoleSimple.model_validate(role_association.role))

        return UserResponse(
            id=user.id,
            tenant_id=user.tenant_id,
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
            roles=roles,
            tenant=TenantSimple.model_validate(user.tenant)
        )

