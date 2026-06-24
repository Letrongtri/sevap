import { createRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from './guards'
import { rootRoute } from './rootRoute'

/** Base private layout route — auth guard only, no shell wrapper */

export const privateLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'private-layout',
    beforeLoad: requireAuth,
    component: () => <Outlet />,
})
