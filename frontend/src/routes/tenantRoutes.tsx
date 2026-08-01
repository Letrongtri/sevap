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
   Document Management Routes
   Accessible to: any user with documents:read OR documents:upload.
   Shares AppShell (tenantLayoutRoute) — no separate sidebar needed.
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
