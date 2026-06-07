import { createRoute, createRouter } from '@tanstack/react-router'
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

// Private
const HomePage = lazyPage(() => import('../pages/HomePage'))
const DashboardPage = lazyPage(() => import('../pages/DashboardPage'))
const ChatPage = lazyPage(() => import('../pages/ChatPage'))
const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'))
const AgentsPage = lazyPage(() => import('../pages/AgentsPage'))
const ReportsPage = lazyPage(() => import('../pages/ReportsPage'))
const SettingsPage = lazyPage(() => import('../pages/SettingsPage'))

/* ============================================================
   Public route leaves
   ============================================================ */

const loginRoute = createRoute({
    getParentRoute: () => publicLayoutRoute,
    path: PUBLIC_ROUTES.LOGIN,
    component: LoginPage,
})

/* ============================================================
   Private route leaves
   ============================================================ */

const homeRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.HOME,
    component: HomePage,
})

const dashboardRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.DASHBOARD,
    component: DashboardPage,
})

const chatRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.CHAT,
    component: ChatPage,
})

const documentsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.DOCUMENTS,
    component: DocumentsPage,
})

const agentsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.AGENTS,
    component: AgentsPage,
})

const reportsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.REPORTS,
    component: ReportsPage,
})

const settingsRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    path: PRIVATE_ROUTES.SETTINGS,
    component: SettingsPage,
})

/* ============================================================
   Assemble the full route tree
   ============================================================ */

const routeTree = rootRoute.addChildren([
    publicLayoutRoute.addChildren([loginRoute]),
    privateLayoutRoute.addChildren([
        homeRoute,
        dashboardRoute,
        chatRoute,
        documentsRoute,
        agentsRoute,
        reportsRoute,
        settingsRoute,
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
