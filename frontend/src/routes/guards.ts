import { redirect } from '@tanstack/react-router'
import { useAuthStore, checkAuthOrRefresh } from '../store/authStore'
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from './paths'
import {
    hasPermission,
    isGlobalAdmin as checkIsGlobalAdmin,
} from '../lib/permissions'

/* ============================================================
   Route Guards
   ============================================================ */

/** Guard: Redirect already-authenticated tenant users away from /login */
export async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuthOrRefresh()
    if (isAuthenticated) {
        const { user } = useAuthStore.getState()
        // Global admin đã login → không redirect về HOME (sẽ bị chặn bởi requireTenantUserGuard)
        if (!checkIsGlobalAdmin(user)) {
            throw redirect({ to: PRIVATE_ROUTES.HOME })
        }
        // Global admin thường login qua /global-admin/login, nếu đã login → home sẽ chuyển tiếp
        throw redirect({ to: PRIVATE_ROUTES.HOME })
    }
}

/** Guard: Redirect already-authenticated global admins away from /global-admin/login */
export async function redirectGlobalAdminIfAuthenticated() {
    const isAuthenticated = await checkAuthOrRefresh()
    if (isAuthenticated) {
        const { user } = useAuthStore.getState()
        if (checkIsGlobalAdmin(user)) {
            throw redirect({ to: PRIVATE_ROUTES.GLOBAL_DASHBOARD })
        }
        // Tenant user lạc vào /global-admin/login → về trang chủ
        throw redirect({ to: PRIVATE_ROUTES.HOME })
    }
}

/** Guard: Require authentication. Redirects unauthenticated users to login */
export async function requireAuth() {
    const isAuthenticated = await checkAuthOrRefresh()
    if (!isAuthenticated) {
        throw redirect({ to: PUBLIC_ROUTES.LOGIN })
    }
}

/** Guard: Prevent Global Admin from accessing Zone 1 (tenant-scoped pages) */
export function requireTenantUserGuard() {
    const { user } = useAuthStore.getState()
    if (checkIsGlobalAdmin(user)) {
        throw redirect({ to: PRIVATE_ROUTES.GLOBAL_DASHBOARD })
    }
}

/**
 * Guard: Require a specific permission (permission-based RBAC).
 * Fail → redirect /403 để user biết lý do.
 * Dùng cho Zone 2 (documents:upload) và Zone 3 (users:create).
 */
export function requirePermissionGuard(permission: string) {
    return function () {
        const { user } = useAuthStore.getState()

        // Global admin không thuộc tenant scope → về zone 4
        if (checkIsGlobalAdmin(user)) {
            throw redirect({ to: PRIVATE_ROUTES.GLOBAL_DASHBOARD })
        }

        if (!hasPermission(user, permission)) {
            throw redirect({ to: PRIVATE_ROUTES.FORBIDDEN })
        }
    }
}

/**
 * Guard: Verify user is a Global Admin (isGlobalAdmin flag from JWT).
 * Fail → redirect / (stealth — ẩn sự tồn tại của Zone 4).
 */
export function requireGlobalAdminGuard() {
    const { user } = useAuthStore.getState()
    if (!checkIsGlobalAdmin(user)) {
        throw redirect({ to: PRIVATE_ROUTES.HOME })
    }
}

/** @deprecated Dùng requirePermissionGuard('users:create') thay thế */
export function requireTenantManagerGuard() {
    const { user } = useAuthStore.getState()
    if (checkIsGlobalAdmin(user)) {
        throw redirect({ to: PRIVATE_ROUTES.GLOBAL_DASHBOARD })
    }
    const isManager =
        user?.roles?.includes('admin') ||
        user?.roles?.includes('knowledge_manager')
    if (!isManager) {
        throw redirect({ to: PRIVATE_ROUTES.FORBIDDEN })
    }
}
