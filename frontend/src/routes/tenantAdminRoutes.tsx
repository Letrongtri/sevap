import { createRoute } from '@tanstack/react-router'
import { privateLayoutRoute } from './privateLayoutRoute'
import { PRIVATE_ROUTES } from './paths'
import { requirePermissionGuard } from './guards'
import { lazyPage } from './helpers'
import { ZoneShell } from '../components/layout/ZoneShell'
import { AdminSidebar } from '../components/sidebar/AdminSidebar'

/* ============================================================
   Zone 3 — Admin Panel Routes
   Accessible to: admin only (users:create permission).
   Uses a dedicated AdminShell with its own sidebar.
   ============================================================ */

// Lazy-loaded admin pages
const AccountsPage = lazyPage(() => import('../pages/AccountsPage'))
const RolesPage = lazyPage(() => import('../pages/RolesPage'))
const DepartmentsPage = lazyPage(() => import('../pages/DepartmentsPage'))
const JobTitlesPage = lazyPage(() => import('../pages/JobTitlesPage'))
const TenantLogsPage = lazyPage(() => import('../pages/TenantLogPage'))

/** Zone 3 layout route — admin-only permission guard + admin shell */
export const tenantAdminLayoutRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    id: 'tenant-admin-layout',
    beforeLoad: requirePermissionGuard('users:create'),
    component: () => <ZoneShell SidebarComponent={AdminSidebar} />,
})

export const adminAccountsRoute = createRoute({
    getParentRoute: () => tenantAdminLayoutRoute,
    path: PRIVATE_ROUTES.ADMIN_ACCOUNTS,
    component: AccountsPage,
})

export const adminRolesRoute = createRoute({
    getParentRoute: () => tenantAdminLayoutRoute,
    path: PRIVATE_ROUTES.ADMIN_ROLES,
    component: RolesPage,
})

export const adminDepartmentsRoute = createRoute({
    getParentRoute: () => tenantAdminLayoutRoute,
    path: PRIVATE_ROUTES.ADMIN_DEPARTMENTS,
    component: DepartmentsPage,
})

export const adminJobTitlesRoute = createRoute({
    getParentRoute: () => tenantAdminLayoutRoute,
    path: PRIVATE_ROUTES.ADMIN_JOB_TITLES,
    component: JobTitlesPage,
})

export const tenantLogsRoute = createRoute({
    getParentRoute: () => tenantAdminLayoutRoute,
    path: PRIVATE_ROUTES.TENANT_LOGS,
    component: TenantLogsPage,
})

export const tenantAdminRoutes = [
    tenantAdminLayoutRoute,
    adminAccountsRoute,
    adminRolesRoute,
    adminDepartmentsRoute,
    adminJobTitlesRoute,
    tenantLogsRoute,
] as const
