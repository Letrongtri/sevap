import { useQuery } from '@tanstack/react-query'
import { useTenantLogStore } from '../store/tenantLogStore'
import type {
    TenantLogDetail,
    TenantLogFilters,
    TenantLogPaginatedResponse,
} from '../types/tenantLog'
import { fetchTenantLogById, fetchTenantLogs } from '../api/tenantLog'
import type { ID } from '../types/common'

export const TENANT_LOGS_QUERY_KEY = ['tenantLogs'] as const

export function useTenantLogs() {
    const filters = useTenantLogStore((s) => s.filters)

    const queryParams: TenantLogFilters = {
        ...filters,
    }

    const queryKey = [
        ...TENANT_LOGS_QUERY_KEY,
        {
            queryParams,
        },
    ] as const

    const query = useQuery<TenantLogPaginatedResponse>({
        queryKey,
        queryFn: () => fetchTenantLogs(queryParams),
    })

    return {
        ...query,
        tenantLogs: query.data?.data ?? [],
        pagination: query.data?.pagination,
    }
}

export function useTenantLogById(id: ID) {
    const query = useQuery<TenantLogDetail>({
        queryKey: [...TENANT_LOGS_QUERY_KEY, id],
        queryFn: () => fetchTenantLogById(id),
    })
    return query
}
