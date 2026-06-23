import { createRoute, createRouter, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import { lazy, Suspense } from 'react'
import { rootRoute } from './rootRoute'
import { publicLayoutRoute } from './publicRoutes'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from './paths'
import { privateLayoutRoute } from './privateRoutes'

function lazyPage(importFn: () => Promise<{ default: React.ComponentType }>) {
    const Comp = lazy(importFn)
    return () => (
        <Suspense fallback={<LoadingSpinner />}>
            <Comp />
        </Suspense>
    )
}

// Public
const LoginPage = lazyPage(() => import('../pages/LoginPage'))
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'))

// Private
const HomePage = lazyPage(() => import('../pages/HomePage'))
const ChatPage = lazyPage(() => import('../pages/ChatPage'))
const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'))
const RolesPage = lazyPage(() => import('../pages/RolesPage'))
const AccountsPage = lazyPage(() => import('../pages/AccountsPage'))

// Global Admin Console
const GlobalAdminDashboard = lazyPage(() => import('../pages/GlobalAdminDashboard'))
const GlobalAdminTenants = lazyPage(() => import('../pages/GlobalAdminPlaceholders').then((m) => ({ default: m.GlobalAdminTenants })))
const GlobalAdminPermissions = lazyPage(() => import('../pages/GlobalAdminPlaceholders').then((m) => ({ default: m.GlobalAdminPermissions })))
const GlobalAdminInfrastructure = lazyPage(() => import('../pages/GlobalAdminPlaceholders').then((m) => ({ default: m.GlobalAdminInfrastructure })))
const GlobalAdminLogs = lazyPage(() => import('../pages/GlobalAdminPlaceholders').then((m) => ({ default: m.GlobalAdminLogs })))

/* ============================================================
   Public route leaves
   ============================================================ */

const loginRoute = createRoute({
    getParentRoute: () => publicLayoutRoute,
    path: PUBLIC_ROUTES.LOGIN,
    component: LoginPage,
})

const registerRoute = createRoute({
    getParentRoute: () => publicLayoutRoute,
    path: PUBLIC_ROUTES.REGISTER,
    component: RegisterPage,
})

/* ============================================================
   Private route leaves
   ============================================================ */

const homeRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.HOME,
    component: HomePage,
})

const chatRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.CHAT,
    component: ChatPage,
})

const chatDetailRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.CHAT_DETAIL,
    component: ChatPage,
})

const documentsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.DOCUMENTS,
    component: DocumentsPage,
})

const rolesRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.ROLES,
    component: RolesPage,
})

const accountsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.ACCOUNTS,
    component: AccountsPage,
})

/* ============================================================
   Global Admin Console Routes (Restricted access)
   ============================================================ */

function requireGlobalAdminGuard() {
    const { user } = useAuthStore.getState()
    const isGlobalAdmin =
        user?.tenantDomain === 'system.hrnexus.com' &&
        user?.roles?.includes('admin')
    if (!isGlobalAdmin) {
        throw redirect({ to: PRIVATE_ROUTES.HOME })
    }
}

const globalDashboardRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_DASHBOARD,
    beforeLoad: requireGlobalAdminGuard,
    component: GlobalAdminDashboard,
})

const globalTenantsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_TENANTS,
    beforeLoad: requireGlobalAdminGuard,
    component: globalAdminPageWrapper(GlobalAdminTenants),
})

const globalPermissionsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_PERMISSIONS,
    beforeLoad: requireGlobalAdminGuard,
    component: globalAdminPageWrapper(GlobalAdminPermissions),
})

const globalInfrastructureRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_INFRASTRUCTURE,
    beforeLoad: requireGlobalAdminGuard,
    component: globalAdminPageWrapper(GlobalAdminInfrastructure),
})

const globalLogsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.GLOBAL_LOGS,
    beforeLoad: requireGlobalAdminGuard,
    component: globalAdminPageWrapper(GlobalAdminLogs),
})

function globalAdminPageWrapper(Comp: React.ComponentType) {
    return () => <Comp />
}

/* ============================================================
   Assemble the full route tree
   ============================================================ */

const routeTree = rootRoute.addChildren([
    publicLayoutRoute.addChildren([loginRoute, registerRoute]),
    privateLayoutRoute.addChildren([
        homeRoute,
        chatRoute,
        chatDetailRoute,
        documentsRoute,
        rolesRoute,
        accountsRoute,
        globalDashboardRoute,
        globalTenantsRoute,
        globalPermissionsRoute,
        globalInfrastructureRoute,
        globalLogsRoute,
    ]),
])

/* ============================================================
   Create & export router
   ============================================================ */

export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadDelay: 100,
})

// Register for full type-safety across Link / useNavigate / useParams
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
