import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import {
    publicLayoutRoute,
    loginRoute,
    registerRoute,
    globalAdminLoginRoute,
} from './publicRoutes'
import {
    tenantLayoutRoute,
    homeRoute,
    chatRoute,
    chatDetailRoute,
    directoryRoute,
    forbiddenRoute,
} from './tenantRoutes'
import { privateLayoutRoute } from './privateLayoutRoute'
import { documentLayoutRoute, documentsRoute } from './documentRoutes'
import {
    tenantAdminLayoutRoute,
    adminAccountsRoute,
    adminRolesRoute,
    adminDepartmentsRoute,
    adminJobTitlesRoute,
    adminLogsRoute,
} from './tenantAdminRoutes'
import { globalAdminLayoutRoute, globalAdminRoutes } from './globalAdminRoutes'

/* ============================================================
   Route Tree Assembly — 4 Zone Architecture
   Zone 1: Basic user  /
   Zone 2: Docs mgmt   /documents
   Zone 3: Admin panel /admin/*
   Zone 4: Global admin /global-admin/*
   ============================================================ */

const routeTree = rootRoute.addChildren([
    // Public routes (no auth)
    publicLayoutRoute.addChildren([loginRoute, registerRoute]),
    globalAdminLoginRoute,

    // Private routes (auth required)
    privateLayoutRoute.addChildren([
        // Zone 1 & 4 — Rendered inside AppShell
        tenantLayoutRoute.addChildren([
            // Zone 1 — Basic user
            homeRoute,
            chatRoute,
            chatDetailRoute,
            directoryRoute,
            forbiddenRoute,
        ]),

        // Zone 2 — Document Management (hr_manager + admin) (renders DocumentShell directly)
        documentLayoutRoute.addChildren([documentsRoute]),

        // Zone 3 — Admin Panel (admin only) (renders AdminShell directly)
        tenantAdminLayoutRoute.addChildren([
            adminAccountsRoute,
            adminRolesRoute,
            adminDepartmentsRoute,
            adminJobTitlesRoute,
            adminLogsRoute,
        ]),

        // Zone 4 — Global Admin (renders AdminShell directly)
        globalAdminLayoutRoute.addChildren([
            // Zone 4 — Global Admin
            ...globalAdminRoutes,
        ]),
    ]),
])

/* ============================================================
   Router instance
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
