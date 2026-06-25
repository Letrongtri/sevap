from .user_schema import (
    UserCreate, UserUpdate, UserUpdatePassword, UserResponse, 
    UserQuery, UserPaginatedResponse, UserSimple, 
    UserSimplePaginatedResponse, UserSimpleQuery
)
from .role_schema import (
    RoleCreate, RoleUpdate, RoleQuery, RoleResponse, 
    RoleSimple, RolePaginatedResponse
)
from .permission_schema import PermissionResponse
from .document_schema import (
    DocumentQuery, DocumentUpdate, DocumentChunkResponse, 
    DocumentResponse, DocumentPaginatedResponse
)
from .conversation_schema import (
    ConversationUpdate, ConversationResponse, 
    ConversationDetailResponse, ConversationPaginatedResponse
)
from .auth_schema import (
    Token, LoginResponse, LoginForm, RefreshTokenRequest, 
    UserInfoResponse, RefreshTokenResponse
)
from .message_schema import MessageSend, MessageResponse
from .department_schema import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentSimple,
    DepartmentQuery, DepartmentPaginatedResponse
)
from .job_title_schema import (
    JobTitleCreate, JobTitleUpdate, JobTitleResponse, JobTitleSimple,
    JobTitleQuery, JobTitlePaginatedResponse
)
from .tenant_schema import (
    TenantCreate, TenantUpdate, TenantResponse, TenantSimple,
    TenantPaginatedResponse, TenantQuery
)
from .global_admin_schema import (
    TenantSummaryResponse, VectorStorageResponse, LLMMetricsResponse,
    DashboardStatsResponse, GrowthVelocityItem, TenantDensityItem,
    OllamaAllocationNode
)
from .base_schema import PaginationQuery, PaginationResponse
from .activity_log_schema import (
    ActivityLogCreate, ActivityLogResponse, 
    ActivityLogQuery, ActivityLogPaginatedResponse
)
from .directory_schema import DirectoryOverviewResponse

UserResponse.model_rebuild()
DepartmentResponse.model_rebuild()
JobTitleResponse.model_rebuild()
