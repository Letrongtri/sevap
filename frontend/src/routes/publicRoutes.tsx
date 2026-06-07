import { createRoute, redirect, Outlet } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { DEFAULT_REDIRECT } from './paths'
import { checkAuthOrRefresh } from '../store/authStore'

/* ============================================================
   Public Routes — accessible without authentication.
   If a user is already logged in and visits /login,
   they get redirected to the dashboard.
   ============================================================ */

/** Redirect already-authenticated users away from auth pages */
async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuthOrRefresh()
    if (isAuthenticated) {
        throw redirect({ to: DEFAULT_REDIRECT })
    }
}

/** Public layout route — centered auth pages, no app shell */
export const publicLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'public',
    beforeLoad: redirectIfAuthenticated,
    component: () => <Outlet />,
})
