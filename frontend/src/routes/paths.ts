// Public route paths (no auth required)
export const PUBLIC_ROUTES = {
    LOGIN: '/login',
    REFRESH: '/refresh',
    REGISTER: '/register',
    GLOBAL_ADMIN_LOGIN: '/global-admin/login',
} as const

// Private route paths (auth required)
export const PRIVATE_ROUTES = {
    // ── Zone 1: Basic User (chat interface) ──────────────────
    HOME: '/',
    CHAT: '/chat',
    CHAT_DETAIL: '/chat/$conversationId',
    DIRECTORY: '/directory',
    PROFILE: '/profile',

    // ── Zone 2: Management Pages (permission-based, AppShell) ──
    DOCUMENTS: '/documents',
    DOCUMENT_PREVIEW: '/documents/preview/$documentId',
    MANAGE_ROLES: '/roles',
    MANAGE_DEPARTMENTS: '/departments',
    MANAGE_JOB_TITLES: '/job-titles',
    MANAGE_ACCOUNTS: '/accounts',
    MANAGE_LOGS: '/logs',
    MANAGE_PROMPT_TEMPLATES: '/prompt-templates',

    // ── Zone 3: Admin Panel (admin only) ─────────────────────
    TENANT_ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_ACCOUNTS: '/admin/accounts',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_DEPARTMENTS: '/admin/departments',
    ADMIN_JOB_TITLES: '/admin/job-titles',
    ADMIN_PROMPT_TEMPLATES: '/admin/prompt-templates',
    TENANT_LOGS: '/admin/logs',

    // ── Zone 4: Global Admin ──────────────────────────────────
    GLOBAL_DASHBOARD: '/global-admin/dashboard',
    GLOBAL_TENANTS: '/global-admin/tenants',
    GLOBAL_PERMISSIONS: '/global-admin/permissions',
    GLOBAL_INFRASTRUCTURE: '/global-admin/infrastructure',
    GLOBAL_LOGS: '/global-admin/logs',

    // ── Error pages ───────────────────────────────────────────
    FORBIDDEN: '/403',
} as const

// Route that tenant users are redirected to after login
export const DEFAULT_REDIRECT = PRIVATE_ROUTES.HOME

// Route that global admins are redirected to after login
export const GLOBAL_ADMIN_REDIRECT = PRIVATE_ROUTES.GLOBAL_DASHBOARD

// Route that unauthenticated users are sent to
export const AUTH_REDIRECT = PUBLIC_ROUTES.LOGIN
