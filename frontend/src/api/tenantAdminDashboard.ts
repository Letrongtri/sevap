import axiosClient from './axios'
import type {
    TenantOverview,
    TenantChatStatsItem,
    TenantDocsStats,
    ChatStatsGroupBy,
} from '../types/tenantAdminDashboard'

/** Lấy thông tin tổng quan của tenant */
export const getTenantOverviewCards = async (): Promise<TenantOverview> => {
    const res = await axiosClient.get(`/admin/dashboard/overview`)
    return res.data
}

/** Lấy thông tin số liệu chat của tenant */
export const getTenantChatStats = async (
    groupBy: ChatStatsGroupBy = 'date',
    fromDate?: string,
    toDate?: string
): Promise<TenantChatStatsItem[]> => {
    const params: Record<string, string> = { group_by: groupBy }
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    const res = await axiosClient.get(`/admin/dashboard/chats/statistics`, {
        params,
    })
    return res.data
}

/** Lấy thông tin phân bố tài liệu của tenant */
export const getTenantDocsStats = async (): Promise<TenantDocsStats> => {
    const res = await axiosClient.get(`/admin/dashboard/documents/statistics`)
    return res.data
}
