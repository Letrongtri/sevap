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

class GraphNodeID(str, Enum):
    INTENT_ROUTER = "intent_router"
    SEMANTIC_CACHE = "semantic_cache"
    RETRIEVAL = "retrieval"
    RERANK = "rerank"
    THRESHOLD_CHECK = "threshold_check"
    REWRITE = "rewrite"
    DIRECT_RESPONSE_GENERATOR = "direct_response_generator"
    FINAL_RESPONSE_GENERATOR = "final_response_generator"
    SECURITY_KILL_SWITCH = "security_kill_switch"
    FALLBACK_NODE = "fallback_node"
    END = "end"

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
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class PromptType(str, Enum):
    ASSISTANT_NAME = "assistant_name"
    ASSISTANT_CAPABILITIES = "assistant_capabilities"
    RESPONSE_BEHAVIORAL = "response_behavioral"
    LANGUAGE = "language"
    RESPONSE_TONE = "response_tone"
    RESPONSE_FORMATTING = "response_formatting"
    RESPONSE_CITATION = "response_citation"
    FALLBACK_RESPONSE = "fallback_response"
    SECURITY_KILL_SWITCH_RESPONSE = "security_kill_switch_response"
