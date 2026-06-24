from enum import Enum

class AccessLevel(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    MANAGERIAL = "managerial"

class DefaultRole(str, Enum):
    GLOBAL_ADMIN = "global_admin"
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    EMPLOYEE = "employee"

class PermissionResource(str, Enum):
    TENANTS = "tenants"
    USERS = "users"
    ROLES = "roles"
    PERMISSIONS = "permissions"
    JOB_TITLES = "job_titles"
    DEPARTMENTS = "departments"
    DOCUMENTS = "documents"
    CONVERSATIONS = "conversations"
    ACTIVITY_LOGS = "activity_logs"

class PermissionAction(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    SUSPEND = "suspend"
    ASSIGN = "assign"
    UPLOAD = "upload"
    SEND = "send"
    DOWNLOAD = "download"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"

class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"

class TenantStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"

class LogLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
