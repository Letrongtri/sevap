import type { AuthUser } from '../types/auth'

/* ============================================================
   Permission Utility — Frontend RBAC helpers
   Format: "resource:action" (e.g. "documents:upload", "users:create")
   ============================================================ */

// ── Permission constants ─────────────────────────────────────

export const PERMISSIONS = {
    // Conversations
    CONVERSATIONS_CREATE: 'conversations:create',
    CONVERSATIONS_READ:   'conversations:read',
    CONVERSATIONS_UPDATE: 'conversations:update',
    CONVERSATIONS_DELETE: 'conversations:delete',
    CONVERSATIONS_SEND:   'conversations:send',

    // Documents
    DOCUMENTS_CREATE:   'documents:create',
    DOCUMENTS_READ:     'documents:read',
    DOCUMENTS_UPDATE:   'documents:update',
    DOCUMENTS_DELETE:   'documents:delete',
    DOCUMENTS_UPLOAD:   'documents:upload',
    DOCUMENTS_DOWNLOAD: 'documents:download',

    // Users
    USERS_CREATE:  'users:create',
    USERS_READ:    'users:read',
    USERS_UPDATE:  'users:update',
    USERS_DELETE:  'users:delete',
    USERS_SUSPEND: 'users:suspend',

    // Roles
    ROLES_CREATE: 'roles:create',
    ROLES_READ:   'roles:read',
    ROLES_UPDATE: 'roles:update',
    ROLES_DELETE: 'roles:delete',
    ROLES_ASSIGN: 'roles:assign',

    // Departments
    DEPARTMENTS_CREATE: 'departments:create',
    DEPARTMENTS_READ:   'departments:read',
    DEPARTMENTS_UPDATE: 'departments:update',
    DEPARTMENTS_DELETE: 'departments:delete',
    DEPARTMENTS_ASSIGN: 'departments:assign',

    // Job Titles
    JOB_TITLES_CREATE: 'job_titles:create',
    JOB_TITLES_READ:   'job_titles:read',
    JOB_TITLES_UPDATE: 'job_titles:update',
    JOB_TITLES_DELETE: 'job_titles:delete',
    JOB_TITLES_ASSIGN: 'job_titles:assign',

    // Permissions (meta)
    PERMISSIONS_READ: 'permissions:read',

    // Activity Logs
    ACTIVITY_LOGS_READ: 'activity_logs:read',

    // Prompt Templates
    PROMPT_TEMPLATES_CREATE: 'prompt_templates:create',
    PROMPT_TEMPLATES_READ:   'prompt_templates:read',
    PROMPT_TEMPLATES_UPDATE: 'prompt_templates:update',
    PROMPT_TEMPLATES_DELETE: 'prompt_templates:delete',

    // Tenants (global admin scope)
    TENANTS_CREATE:  'tenants:create',
    TENANTS_READ:    'tenants:read',
    TENANTS_UPDATE:  'tenants:update',
    TENANTS_DELETE:  'tenants:delete',
    TENANTS_SUSPEND: 'tenants:suspend',
} as const

// ── Core helpers ─────────────────────────────────────────────

/**
 * Kiểm tra user có permission cụ thể không.
 * Global Admin luôn có tất cả quyền trên platform của họ.
 */
export function hasPermission(
    user: AuthUser | null | undefined,
    permission: string
): boolean {
    if (!user) return false
    return user.permissions?.includes(permission) ?? false
}

/**
 * Kiểm tra user có ÍT NHẤT MỘT trong danh sách permissions.
 */
export function hasAnyPermission(
    user: AuthUser | null | undefined,
    permissions: string[]
): boolean {
    if (!user) return false
    return permissions.some((p) => user.permissions?.includes(p))
}

/**
 * Kiểm tra user có TẤT CẢ permissions trong danh sách.
 */
export function hasAllPermissions(
    user: AuthUser | null | undefined,
    permissions: string[]
): boolean {
    if (!user) return false
    return permissions.every((p) => user.permissions?.includes(p))
}

// ── Zone access helpers ──────────────────────────────────────

/**
 * Kiểm tra user có role cụ thể không.
 */
export function hasRole(
    user: AuthUser | null | undefined,
    roleName: string
): boolean {
    if (!user || !user.roles) return false
    return user.roles.includes(roleName)
}

/**
 * Admin (tenant) — được xác định dựa trên vai trò (roles: includes 'admin').
 * Dùng để quyết định hiển thị SwitchButton → Admin Panel.
 */
export function isAdminRole(user: AuthUser | null | undefined): boolean {
    return hasRole(user, 'admin')
}

/**
 * HR Manager — được xác định dựa trên vai trò (roles: includes 'hr_manager').
 */
export function isHrManagerRole(user: AuthUser | null | undefined): boolean {
    return hasRole(user, 'hr_manager')
}

/**
 * Zone 2 — Document Management.
 * Admin và HR Manager đều có documents:upload.
 */
export function canAccessDocumentZone(
    user: AuthUser | null | undefined
): boolean {
    return hasPermission(user, PERMISSIONS.DOCUMENTS_UPLOAD)
}

/**
 * Zone 3 — Admin Panel.
 * Chỉ Admin (users:create + roles:create) mới thấy nút switch.
 */
export function canAccessTenantAdminZone(
    user: AuthUser | null | undefined
): boolean {
    return isAdminRole(user)
}

/**
 * Zone 4 — Global Admin.
 * Điều kiện: isGlobalAdmin flag từ JWT.
 */
export function isGlobalAdmin(user: AuthUser | null | undefined): boolean {
    return user?.isGlobalAdmin === true
}
