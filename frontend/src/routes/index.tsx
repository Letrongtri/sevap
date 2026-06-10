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
const ChatPage = lazyPage(() => import('../pages/ChatPage'))
const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'))
const RolesPage = lazyPage(() => import('../pages/RolesPage'))
const AccountsPage = lazyPage(() => import('../pages/AccountsPage'))

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
   Assemble the full route tree
   ============================================================ */

const routeTree = rootRoute.addChildren([
    publicLayoutRoute.addChildren([loginRoute]),
    privateLayoutRoute.addChildren([
        homeRoute,
        chatRoute,
        chatDetailRoute,
        documentsRoute,
        rolesRoute,
        accountsRoute,
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
