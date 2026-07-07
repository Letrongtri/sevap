from enum import Enum

class IntentType(str, Enum):
    DIRECT = "direct"       # Trả lời trực tiếp, không cần RAG
    SINGLE_RAG = "single_rag"   # Cần RAG, 1 ý hỏi
    MULTI_RAG = "multi_rag"    # Cần RAG, nhiều ý hỏi
    UNKNOWN = "unknown"      # Không phân loại được
    SECURITY_ANOMALY = "security_anomaly" # Hành vi tấn công, spam, prompt injection, v.v.

class RetrievalExecutionPlan(str, Enum):
    DIRECT = "direct"         # Cho trường hợp Single-rag
    PARALLEL = "parallel"     # Các câu hỏi con có thể chạy song song (không phụ thuộc nhau)
    SEQUENTIAL = "sequential" # Câu hỏi con sau cần kết quả câu hỏi trước
    UNKNOWN = "unknown"      # Không phân loại được

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
