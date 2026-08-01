import { useAuthStore } from '../store/authStore'
import {
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdminRole,
} from '../lib/permissions'

/* ============================================================
   usePermission — Convenience hooks for permission & role checks
   Reads user from auth store and delegates to lib/permissions.
   ============================================================ */

/**
 * Returns true if the current user has the specified permission.
 */
export function usePermission(permission: string): boolean {
    const user = useAuthStore((s) => s.user)
    return hasPermission(user, permission)
}

/**
 * Returns true if the current user has at least one of the
 * specified permissions.
 */
export function useAnyPermission(permissions: string[]): boolean {
    const user = useAuthStore((s) => s.user)
    return hasAnyPermission(user, permissions)
}

/**
 * Returns true if the current user has the specified role.
 */
export function useRole(role: string): boolean {
    const user = useAuthStore((s) => s.user)
    return hasRole(user, role)
}

/**
 * Returns true if the current user is an admin.
 */
export function useIsAdmin(): boolean {
    const user = useAuthStore((s) => s.user)
    return isAdminRole(user)
}
