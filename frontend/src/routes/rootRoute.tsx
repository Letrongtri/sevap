import { createRootRoute, Outlet } from '@tanstack/react-router'

/* ============================================================
   Root Route — wraps the entire app tree.
   All other routes are children of this.
   ============================================================ */

export const rootRoute = createRootRoute({
    component: () => <Outlet />,
})
