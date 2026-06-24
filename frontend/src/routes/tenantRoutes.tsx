import { createRoute } from '@tanstack/react-router'
import { PRIVATE_ROUTES } from './paths'
import { requireTenantUserGuard } from './guards'
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

// Zone 1 page imports
const HomePage = lazyPage(() => import('../pages/HomePage'))
const ChatPage = lazyPage(() => import('../pages/ChatPage'))
const DirectoryPage = lazyPage(() => import('../pages/DirectoryPage'))
const ForbiddenPage = lazyPage(() => import('../pages/ForbiddenPage'))

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
