import { createRoute, Outlet } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { PUBLIC_ROUTES } from './paths'
import {
    redirectIfAuthenticated,
    redirectGlobalAdminIfAuthenticated,
} from './guards'
import { lazyPage } from './helpers'

/* ============================================================
   Public Routes — accessible without authentication.
   ============================================================ */

const LoginPage = lazyPage(() => import('../pages/LoginPage'))
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'))
const GlobalAdminLoginPage = lazyPage(
    () => import('../pages/GlobalAdminLoginPage')
)

/** Public layout route — centered auth pages, no app shell.
 *  Guard: redirect already-authenticated tenant users away. */
export const publicLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'public-layout',
    beforeLoad: redirectIfAuthenticated,
    component: () => <Outlet />,
})

export const loginRoute = createRoute({
    getParentRoute: () => publicLayoutRoute,
    path: PUBLIC_ROUTES.LOGIN,
    component: LoginPage,
})

export const registerRoute = createRoute({
    getParentRoute: () => publicLayoutRoute,
    path: PUBLIC_ROUTES.REGISTER,
    component: RegisterPage,
})

/**
 * Global Admin login — lives OUTSIDE publicLayoutRoute because:
 * - It needs its own redirect guard (redirectGlobalAdminIfAuthenticated)
 * - publicLayoutRoute's guard would incorrectly redirect GA users to HOME
 */
export const globalAdminLoginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: PUBLIC_ROUTES.GLOBAL_ADMIN_LOGIN,
    beforeLoad: redirectGlobalAdminIfAuthenticated,
    component: GlobalAdminLoginPage,
})
