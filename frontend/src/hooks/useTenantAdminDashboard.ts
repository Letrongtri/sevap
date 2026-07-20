import { useQuery } from '@tanstack/react-query'
import {
    getTenantChatStats,
    getTenantDocsStats,
    getTenantOverviewCards,
} from '../api/tenantAdminDashboard'
import type {
    TenantChatStatsItem,
    TenantDocsStats,
    TenantOverview,
} from '../types/tenantAdminDashboard'
import { useTenantAdminDashboardStore } from '../store/tenantAdminDashboardStore'

export const TENANT_OVERVIEW_QUERY_KEY = ['tenant-overview'] as const
export const TENANT_DOCS_STATS_QUERY_KEY = ['tenant-docs-stats'] as const
export const TENANT_CHAT_STATS_QUERY_KEY = ['tenant-chat-stats'] as const

/** Hook lấy thông tin tenant */
export function useTenantOverviewCards() {
    return useQuery<TenantOverview>({
        queryKey: TENANT_OVERVIEW_QUERY_KEY,
        queryFn: getTenantOverviewCards,
    })
}

export function useTenantDocsStats() {
    return useQuery<TenantDocsStats>({
        queryKey: TENANT_DOCS_STATS_QUERY_KEY,
        queryFn: getTenantDocsStats,
    })
}

export function useTenantChatStats() {
    const groupBy = useTenantAdminDashboardStore((s) => s.chatStatsGroupBy)
    const fromDate = useTenantAdminDashboardStore((s) => s.chatStatsFromDate)
    const toDate = useTenantAdminDashboardStore((s) => s.chatStatsToDate)

    const query = useQuery<TenantChatStatsItem[]>({
        queryKey: [...TENANT_CHAT_STATS_QUERY_KEY, groupBy, fromDate, toDate],
        queryFn: () => getTenantChatStats(groupBy, fromDate, toDate),
    })

    return query
}
