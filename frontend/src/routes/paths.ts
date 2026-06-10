// Public route paths (no auth required)
export const PUBLIC_ROUTES = {
    LOGIN: '/login',
    REFRESH: '/refresh',
} as const

// Private route paths (auth required)
export const PRIVATE_ROUTES = {
    HOME: '/',
    CHAT: '/chat',
    CHAT_DETAIL: '/chat/$conversationId',
    DOCUMENTS: '/documents',
    ROLES: '/roles',
    ACCOUNTS: '/accounts',
} as const

// Route that users are redirected to after login
export const DEFAULT_REDIRECT = PRIVATE_ROUTES.HOME

// Route that unauthenticated users are sent to
export const AUTH_REDIRECT = PUBLIC_ROUTES.LOGIN
