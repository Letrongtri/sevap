import { createRoute } from '@tanstack/react-router'
import { PRIVATE_ROUTES } from './paths'
import { requireTenantUserGuard, requirePermissionGuard } from './guards'
import { lazyPage } from './helpers'
import { privateLayoutRoute } from './privateLayoutRoute'
import { AppShell } from '../components/layout/AppShell'

/* ============================================================
   Zone 1 — Basic User Routes
   Accessible to all authenticated tenant users.
   AppShell wraps all Zone 1 page contents.
   ============================================================ */

/** Tenant layout route — app shell wrapper (inherits auth check) */
export const tenantLayoutRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    id: 'tenant-layout',
    component: AppShell,
})

// Page imports
const HomePage = lazyPage(() => import('../pages/HomePage'))
const ChatPage = lazyPage(() => import('../pages/ChatPage'))
const DirectoryPage = lazyPage(() => import('../pages/DirectoryPage'))
const ForbiddenPage = lazyPage(() => import('../pages/ForbiddenPage'))
const MyProfilePage = lazyPage(() => import('../pages/MyProfilePage'))
const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'))

// ── Zone 1 leaf routes ────────────────────────────────────────

export const homeRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.HOME,
    beforeLoad: requireTenantUserGuard,
    component: HomePage,
})

export const chatRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.CHAT,
    beforeLoad: requireTenantUserGuard,
    component: ChatPage,
})

export const chatDetailRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.CHAT_DETAIL,
    beforeLoad: requireTenantUserGuard,
    component: ChatPage,
})

export const directoryRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.DIRECTORY,
    beforeLoad: requireTenantUserGuard,
    component: DirectoryPage,
})

/** 403 Forbidden — shown when user lacks permission for a Zone 2/3 page */
export const forbiddenRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.FORBIDDEN,
    component: ForbiddenPage,
})

/** My Profile — available to all authenticated tenant users */
export const profileRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    path: PRIVATE_ROUTES.PROFILE,
    beforeLoad: requireTenantUserGuard,
    component: MyProfilePage,
})

/* ============================================================
   Zone 2 — Management Routes (permission-based, AppShell)
   Bao gồm: documents, roles, departments, job-titles, accounts,
   logs, prompt-templates. Mỗi route được bảo vệ bởi permission
   riêng — không yêu cầu users:create như Zone 3.
   Render bên trong AppShell — sidebar chính vẫn hiển thị.
   ============================================================ */

/** Permission guard layout route for documents */
export const documentLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'documents-layout',
    beforeLoad: requirePermissionGuard('documents:upload'),
})

export const documentsRoute = createRoute({
    getParentRoute: () => documentLayoutRoute,
    path: PRIVATE_ROUTES.DOCUMENTS,
    component: DocumentsPage,
})

// Lazy-loaded management pages (tái sử dụng các page đã có)
const RolesPage = lazyPage(() => import('../pages/RolesPage'))
const DepartmentsPage = lazyPage(() => import('../pages/DepartmentsPage'))
const JobTitlesPage = lazyPage(() => import('../pages/JobTitlesPage'))
const AccountsPage = lazyPage(() => import('../pages/AccountsPage'))
const TenantLogPage = lazyPage(() => import('../pages/TenantLogPage'))
const PromptTemplatesPage = lazyPage(
    () => import('../pages/PromptTemplatesPage')
)

// ── roles:create ───────────────────────────────────────────────
export const manageRolesLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'manage-roles-layout',
    beforeLoad: requirePermissionGuard('roles:create'),
})
export const manageRolesRoute = createRoute({
    getParentRoute: () => manageRolesLayoutRoute,
    path: PRIVATE_ROUTES.MANAGE_ROLES,
    component: RolesPage,
})

// ── departments:create ─────────────────────────────────────────
export const manageDepartmentsLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'manage-departments-layout',
    beforeLoad: requirePermissionGuard('departments:create'),
})
export const manageDepartmentsRoute = createRoute({
    getParentRoute: () => manageDepartmentsLayoutRoute,
    path: PRIVATE_ROUTES.MANAGE_DEPARTMENTS,
    component: DepartmentsPage,
})

// ── job_titles:create ──────────────────────────────────────────
export const manageJobTitlesLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'manage-job-titles-layout',
    beforeLoad: requirePermissionGuard('job_titles:create'),
})
export const manageJobTitlesRoute = createRoute({
    getParentRoute: () => manageJobTitlesLayoutRoute,
    path: PRIVATE_ROUTES.MANAGE_JOB_TITLES,
    component: JobTitlesPage,
})

// ── users:create ───────────────────────────────────────────────
export const manageAccountsLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'manage-accounts-layout',
    beforeLoad: requirePermissionGuard('users:create'),
})
export const manageAccountsRoute = createRoute({
    getParentRoute: () => manageAccountsLayoutRoute,
    path: PRIVATE_ROUTES.MANAGE_ACCOUNTS,
    component: AccountsPage,
})

// ── activity_logs:read ───────────────────────────────────────
export const manageLogsLayoutRoute = createRoute({
    getParentRoute: () => tenantLayoutRoute,
    id: 'manage-logs-layout',
    beforeLoad: requirePermissionGuard('activity_logs:read'),
})
export const manageLogsRoute = createRoute({
    getParentRoute: () => manageLogsLayoutRoute,
    path: PRIVATE_ROUTES.MANAGE_LOGS,
    component: TenantLogPage,
})

