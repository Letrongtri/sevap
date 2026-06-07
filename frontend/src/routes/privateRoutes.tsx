import { createRoute, redirect } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { rootRoute } from './rootRoute'
import { AUTH_REDIRECT } from './paths'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { checkAuthOrRefresh } from '../store/authStore'

/* ============================================================
   Private Routes — require authentication.
   beforeLoad guard redirects unauthenticated users to /login.
   ============================================================ */

// Lazy-load the app shell to keep the login bundle small
// eslint-disable-next-line react-refresh/only-export-components
const AppShell = lazy(() =>
    import('../components/layout/AppShell').then((m) => ({
        default: m.AppShell,
    }))
)

/** Check token presence (replace with full JWT validation later) */
async function requireAuth() {
    const isAuthenticated = await checkAuthOrRefresh()
    if (!isAuthenticated) {
        throw redirect({ to: AUTH_REDIRECT })
    }
}

/** Private layout route — auth guard + app shell wrapper */
export const privateLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'private',
    beforeLoad: requireAuth,
    component: () => (
        <Suspense fallback={<LoadingSpinner />}>
            <AppShell />
        </Suspense>
    ),
})
