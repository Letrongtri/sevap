from app.core.enum import (
    AccessLevel, DefaultRole, 
    PermissionResource, PermissionAction
)

DEFAULT_ROLES = {
    DefaultRole.GLOBAL_ADMIN: {
        "name": DefaultRole.GLOBAL_ADMIN.value, 
        "description": "Quản trị viên toàn hệ thống, có thể quản lý các tenants", 
        "access_level": AccessLevel.MANAGERIAL, 
        "is_system": True,
        "permissions": {
            PermissionResource.TENANTS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.SUSPEND
            ],
            PermissionResource.PERMISSIONS: [PermissionAction.READ],
            PermissionResource.ACTIVITY_LOGS: [PermissionAction.READ]
        }
    },
    DefaultRole.ADMIN: {
        "name": DefaultRole.ADMIN.value,
        "description": "Quản trị viên",
        "access_level": AccessLevel.MANAGERIAL,
        "permissions": {
            PermissionResource.TENANTS: [
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE
            ],
            PermissionResource.USERS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.SUSPEND
            ],
            PermissionResource.ROLES: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.ASSIGN
            ],
            PermissionResource.PERMISSIONS: [
                PermissionAction.READ
            ],
            PermissionResource.JOB_TITLES: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.ASSIGN
            ],
            PermissionResource.DEPARTMENTS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.ASSIGN
            ],
            PermissionResource.DOCUMENTS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.UPLOAD,
                PermissionAction.DOWNLOAD
            ],
            PermissionResource.CONVERSATIONS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.SEND
            ],
            PermissionResource.ACTIVITY_LOGS: [PermissionAction.READ]
        }
    },
    DefaultRole.HR_MANAGER: {
        "name": DefaultRole.HR_MANAGER.value,
        "description": "Quản lý Nhân sự",
        "access_level": AccessLevel.MANAGERIAL,
        "permissions": {
            PermissionResource.USERS: [PermissionAction.READ],
            PermissionResource.ROLES: [PermissionAction.READ],
            PermissionResource.PERMISSIONS: [PermissionAction.READ],
            PermissionResource.JOB_TITLES: [PermissionAction.READ],
            PermissionResource.DEPARTMENTS: [PermissionAction.READ],
            PermissionResource.DOCUMENTS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.UPLOAD,
                PermissionAction.DOWNLOAD
            ],
            PermissionResource.CONVERSATIONS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.SEND
            ]
        }
    },
    DefaultRole.EMPLOYEE: {
        "name": DefaultRole.EMPLOYEE.value,
        "description": "Nhân viên tiêu chuẩn, truy cập dữ liệu public/private",
        "access_level": AccessLevel.PUBLIC,
        "permissions": {
            PermissionResource.USERS: [PermissionAction.READ],
            PermissionResource.ROLES: [PermissionAction.READ],
            PermissionResource.JOB_TITLES: [PermissionAction.READ],
            PermissionResource.DEPARTMENTS: [PermissionAction.READ],
            PermissionResource.DOCUMENTS: [PermissionAction.READ],
            PermissionResource.CONVERSATIONS: [
                PermissionAction.CREATE,
                PermissionAction.READ,
                PermissionAction.UPDATE,
                PermissionAction.DELETE,
                PermissionAction.SEND
            ]
        }
    }
}

def get_default_role(name: str):
    return DEFAULT_ROLES.get(name)