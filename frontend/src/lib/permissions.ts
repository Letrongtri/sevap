import type { AuthUser } from '../types/auth'

/* ============================================================
   Permission Utility — Frontend RBAC helpers
   Format: "resource:action" (e.g. "documents:upload", "users:create")
   ============================================================ */

// ── Permission constants ─────────────────────────────────────

export const PERMISSIONS = {
    // Conversations
    CONVERSATIONS_SEND: 'conversations:send',
    CONVERSATIONS_READ: 'conversations:read',

    // Documents
    DOCUMENTS_READ: 'documents:read',
    DOCUMENTS_UPLOAD: 'documents:upload',
    DOCUMENTS_CREATE: 'documents:create',
    DOCUMENTS_UPDATE: 'documents:update',
    DOCUMENTS_DELETE: 'documents:delete',
    DOCUMENTS_DOWNLOAD: 'documents:download',

    // Users
    USERS_READ: 'users:read',
    USERS_CREATE: 'users:create',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    USERS_SUSPEND: 'users:suspend',

    // Roles
    ROLES_READ: 'roles:read',
    ROLES_CREATE: 'roles:create',
    ROLES_UPDATE: 'roles:update',
    ROLES_DELETE: 'roles:delete',
    ROLES_ASSIGN: 'roles:assign',

    // Departments
    DEPARTMENTS_READ: 'departments:read',
    DEPARTMENTS_CREATE: 'departments:create',
    DEPARTMENTS_UPDATE: 'departments:update',
    DEPARTMENTS_DELETE: 'departments:delete',
    DEPARTMENTS_ASSIGN: 'departments:assign',

    // Job Titles
    JOB_TITLES_READ: 'job_titles:read',
    JOB_TITLES_CREATE: 'job_titles:create',
    JOB_TITLES_UPDATE: 'job_titles:update',
    JOB_TITLES_DELETE: 'job_titles:delete',
    JOB_TITLES_ASSIGN: 'job_titles:assign',

    // Permissions (meta)
    PERMISSIONS_READ: 'permissions:read',

    // Activity Logs
    ACTIVITY_LOGS_READ: 'activity_logs:read',

    // Tenants (global admin)
    TENANTS_READ: 'tenants:read',
    TENANTS_CREATE: 'tenants:create',
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
 * Zone 2 — Document Management.
 * Điều kiện: có quyền documents:upload (hr_manager + admin).
 * Dùng để hiện nút "Document Manager" trong Zone 1 sidebar.
 */
export function canAccessDocumentZone(
    user: AuthUser | null | undefined
): boolean {
    return hasPermission(user, PERMISSIONS.DOCUMENTS_UPLOAD)
}

/**
 * Zone 3 — Admin Panel.
 * Điều kiện: có quyền users:create (admin only).
 * Dùng để hiện nút "Admin Panel" trong Zone 1 sidebar.
 */
export function canAccessTenantAdminZone(
    user: AuthUser | null | undefined
): boolean {
    return hasPermission(user, PERMISSIONS.USERS_CREATE)
}

/**
 * Zone 4 — Global Admin.
 * Điều kiện: isGlobalAdmin flag từ JWT.
 */
export function isGlobalAdmin(user: AuthUser | null | undefined): boolean {
    return user?.isGlobalAdmin === true
}
