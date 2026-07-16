import type { ID } from '../types/common'
import type {
    TenantLogDetail,
    TenantLogFilters,
    TenantLogPaginatedResponse,
} from '../types/tenantLog'
import axiosClient from './axios'

export const fetchTenantLogs = async (
    filters: TenantLogFilters
): Promise<TenantLogPaginatedResponse> => {
    const response = await axiosClient.get(`/logs`, {
        params: {
            ...filters,
        },
    })
    return response.data
}

export const fetchTenantLogById = async (id: ID): Promise<TenantLogDetail> => {
    const res = await axiosClient.get(`/logs/${id}`)
    return res.data
}
