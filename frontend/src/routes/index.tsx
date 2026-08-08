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
    profileRoute,
    // Zone 2 — Management routes (AppShell, permission-based)
    documentLayoutRoute,
    documentsRoute,
    documentPreviewRoute,
    manageRolesLayoutRoute,
    manageRolesRoute,
    manageDepartmentsLayoutRoute,
    manageDepartmentsRoute,
    manageJobTitlesLayoutRoute,
    manageJobTitlesRoute,
    manageAccountsLayoutRoute,
    manageAccountsRoute,
    manageLogsLayoutRoute,
    manageLogsRoute,
    managePromptTemplatesLayoutRoute,
    managePromptTemplatesRoute,
} from './tenantRoutes'
import { privateLayoutRoute } from './privateLayoutRoute'
import {
    tenantAdminLayoutRoute,
    tenantAdminDashboardRoute,
    adminAccountsRoute,
    adminRolesRoute,
    adminDepartmentsRoute,
    adminJobTitlesRoute,
    tenantLogsRoute,
    adminPromptTemplatesRoute,
} from './tenantAdminRoutes'
import { globalAdminLayoutRoute, globalAdminRoutes } from './globalAdminRoutes'

/* ============================================================
   Route Tree Assembly — 3 Zone Architecture
   Zone 1: Basic user       /
   Zone 2: Management pages /documents, /manage/*  (permission-based, AppShell)
   Zone 3: Admin panel      /admin/*               (users:create required)
   Zone 4: Global admin     /global-admin/*
   ============================================================ */

const routeTree = rootRoute.addChildren([
    // Public routes (no auth)
    publicLayoutRoute.addChildren([loginRoute, registerRoute]),
    globalAdminLoginRoute,

    // Private routes (auth required)
    privateLayoutRoute.addChildren([
        // Zone 1 & document routes — Rendered inside AppShell
        tenantLayoutRoute.addChildren([
            // Zone 1 — Basic user
            homeRoute,
            chatRoute,
            chatDetailRoute,
            directoryRoute,
            forbiddenRoute,
            profileRoute,

            // Zone 2 — Management pages (permission-based, AppShell sidebar)
            documentLayoutRoute.addChildren([documentsRoute, documentPreviewRoute]),
            manageRolesLayoutRoute.addChildren([manageRolesRoute]),
            manageDepartmentsLayoutRoute.addChildren([manageDepartmentsRoute]),
            manageJobTitlesLayoutRoute.addChildren([manageJobTitlesRoute]),
            manageAccountsLayoutRoute.addChildren([manageAccountsRoute]),
            manageLogsLayoutRoute.addChildren([manageLogsRoute]),
            managePromptTemplatesLayoutRoute.addChildren([
                managePromptTemplatesRoute,
            ]),
        ]),

        // Zone 3 — Admin Panel (admin only) (renders AdminShell directly)
        tenantAdminLayoutRoute.addChildren([
            tenantAdminDashboardRoute,
            adminAccountsRoute,
            adminRolesRoute,
            adminDepartmentsRoute,
            adminJobTitlesRoute,
            tenantLogsRoute,
            adminPromptTemplatesRoute,
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
