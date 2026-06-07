// Public route paths (no auth required)
export const PUBLIC_ROUTES = {
    LOGIN: '/login',
    REFRESH: '/refresh',
} as const

// Private route paths (auth required)
export const PRIVATE_ROUTES = {
    DASHBOARD: '/',
    CHAT: '/chat',
    DOCUMENTS: '/documents',
    AGENTS: '/agents',
    REPORTS: '/reports',
    SETTINGS: '/settings',
} as const

// Route that users are redirected to after login
export const DEFAULT_REDIRECT = PRIVATE_ROUTES.DASHBOARD

// Route that unauthenticated users are sent to
export const AUTH_REDIRECT = PUBLIC_ROUTES.LOGIN
