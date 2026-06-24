import { createRoute } from '@tanstack/react-router'
import { privateLayoutRoute } from './privateLayoutRoute'
import { PRIVATE_ROUTES } from './paths'
import { requirePermissionGuard } from './guards'
import { lazyPage } from './helpers'
import { ZoneShell } from '../components/layout/ZoneShell'
import { DocumentSidebar } from '../components/sidebar/DocumentSidebar'

/* ============================================================
   Zone 2 — Document Management Routes
   Accessible to: hr_manager + admin (documents:upload permission).
   Uses a dedicated DocumentShell with its own sidebar.
   ============================================================ */

const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'))

/** Zone 2 layout route — permission guard + document shell */
export const documentLayoutRoute = createRoute({
    getParentRoute: () => privateLayoutRoute,
    id: 'documents-layout',
    beforeLoad: requirePermissionGuard('documents:upload'),
    component: () => <ZoneShell SidebarComponent={DocumentSidebar} />,
})

export const documentsRoute = createRoute({
    getParentRoute: () => documentLayoutRoute,
    path: PRIVATE_ROUTES.DOCUMENTS,
    component: DocumentsPage,
})

export const documentRoutes = [documentLayoutRoute, documentsRoute] as const
