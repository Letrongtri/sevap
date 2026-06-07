/* ============================================================
   API Constants
   ============================================================ */

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const API_VERSION = 'v1'

export const API_TIMEOUT_MS = 15_000

export const ENDPOINTS = {
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        me: '/auth/me',
    },
    chat: {
        conversations: '/chat/conversations',
        messages: (id: string) => `/chat/conversations/${id}/messages`,
        send: (id: string) => `/chat/conversations/${id}/send`,
    },
    documents: {
        list: '/documents',
        upload: '/documents/upload',
        embed: (id: string) => `/documents/${id}/embed`,
        delete: (id: string) => `/documents/${id}`,
    },
    agents: {
        list: '/agents',
        status: '/agents/status',
    },
    mcp: {
        servers: '/mcp/servers',
        toggle: (id: string) => `/mcp/servers/${id}/toggle`,
    },
    rbac: {
        roles: '/rbac/roles',
        permissions: '/rbac/permissions',
        matrix: '/rbac/matrix',
    },
} as const
