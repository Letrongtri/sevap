import { createRoute } from '@tanstack/react-router'
import { PRIVATE_ROUTES } from './paths'
import { requireGlobalAdminGuard } from './guards'
import { lazyPage } from './helpers'
import { privateLayoutRoute } from './privateLayoutRoute'
import { ZoneShell } from '../components/layout/ZoneShell'
import { GlobalAdminSidebar } from '../components/sidebar/GlobalAdminSidebar'

/* ============================================================
   Global Admin Routes — require authentication + system admin domain scoping.
   ============================================================ */

// Lazy-loaded pages
const GlobalAdminDashboard = lazyPage(
    () => import('../pages/GlobalAdminDashboard')
)
const GlobalAdminTenants = lazyPage(
    () => import('../pages/GlobalAdminTenantsPage')
)
const GlobalAdminPermissions = lazyPage(() =>
    import('../pages/GlobalAdminPlaceholders').then((m) => ({
        default: m.GlobalAdminPermissions,
    }))
)
const GlobalAdminInfrastructure = lazyPage(() =>
    import('../pages/GlobalAdminPlaceholders').then((m) => ({
        default: m.GlobalAdminInfrastructure,
    }))
)
const GlobalAdminLogs = lazyPage(() =>
    import('../pages/GlobalAdminPlaceholders').then((m) => ({
        default: m.GlobalAdminLogs,
    }))
)

/** Zone 4 layout route — global admin-only permission guard + global admin shell */
export const globalAdminLayoutRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    id: 'global-admin-layout',
    beforeLoad: requireGlobalAdminGuard,
    component: () => <ZoneShell SidebarComponent={GlobalAdminSidebar} />,
})

export const globalDashboardRoute = createRoute({
    getParentRoute: () => globalAdminLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_DASHBOARD,
    component: GlobalAdminDashboard,
})

export const globalTenantsRoute = createRoute({
    getParentRoute: () => globalAdminLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_TENANTS,
    component: GlobalAdminTenants,
})

export const globalPermissionsRoute = createRoute({
    getParentRoute: () => globalAdminLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_PERMISSIONS,
    component: GlobalAdminPermissions,
})

export const globalInfrastructureRoute = createRoute({
    getParentRoute: () => globalAdminLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_INFRASTRUCTURE,
    component: GlobalAdminInfrastructure,
})

export const globalLogsRoute = createRoute({
    getParentRoute: () => globalAdminLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_LOGS,
    component: GlobalAdminLogs,
})

export const globalAdminRoutes = [
    globalDashboardRoute,
    globalTenantsRoute,
    globalPermissionsRoute,
    globalInfrastructureRoute,
    globalLogsRoute,
] as const
