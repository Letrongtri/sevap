import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGlobalTenantStore } from '../store/globalTenantStore'
import type {
    AdminCreateTenantPayload,
    AdminUpdateTenantPayload,
    Tenant,
    TenantPaginatedResponse,
    TenantQuery,
    TenantSummaryResponse,
} from '../types/tenant'
import {
    createGlobalTenant,
    deleteGlobalTenant,
    fetchGlobalTenantById,
    fetchGlobalTenants,
    fetchTenantSummary,
    updateGlobalTenant,
} from '../api/globalAdminTenant'

export const GLOBAL_TENANTS_QUERY_KEY = ['global-tenants'] as const
export const GLOBAL_TENANT_SUMMARY_QUERY_KEY = ['global-tenant-summary'] as const
export const GLOBAL_TENANT_DETAIL_QUERY_KEY = ['global-tenant-detail'] as const

/** Hook lấy danh sách tenant phân trang cho Global Admin */
export function useGlobalTenants() {
    const querySearch = useGlobalTenantStore((s) => s.query)
    const statusFilter = useGlobalTenantStore((s) => s.statusFilter)
    const page = useGlobalTenantStore((s) => s.page)
    const limit = useGlobalTenantStore((s) => s.limit)

    const queryParams: TenantQuery = {
        query: querySearch,
        status: statusFilter,
        page,
        limit,
    }

    const queryKey = [
        ...GLOBAL_TENANTS_QUERY_KEY,
        {
            querySearch,
            statusFilter,
            page,
            limit,
        },
    ] as const

    const query = useQuery<TenantPaginatedResponse>({
        queryKey,
        queryFn: () => fetchGlobalTenants(queryParams),
    })

    return {
        ...query,
        tenants: query.data?.tenants ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook lấy thống kê tổng quan tenant */
export function useTenantSummary() {
    return useQuery<TenantSummaryResponse>({
        queryKey: GLOBAL_TENANT_SUMMARY_QUERY_KEY,
        queryFn: fetchTenantSummary,
    })
}

/** Hook lấy chi tiết 1 tenant theo ID */
export function useGlobalTenantDetail(tenantId: string | null) {
    return useQuery<Tenant>({
        queryKey: [...GLOBAL_TENANT_DETAIL_QUERY_KEY, tenantId],
        queryFn: () => fetchGlobalTenantById(tenantId!),
        enabled: Boolean(tenantId),
    })
}

/** Hook tạo tenant mới */
export function useCreateGlobalTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, AdminCreateTenantPayload>({
        mutationFn: createGlobalTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GLOBAL_TENANTS_QUERY_KEY })
            queryClient.invalidateQueries({
                queryKey: GLOBAL_TENANT_SUMMARY_QUERY_KEY,
            })
        },
    })
}

/** Hook cập nhật tenant */
export function useUpdateGlobalTenant() {
    const queryClient = useQueryClient()
    return useMutation<
        Tenant,
        Error,
        { id: string; payload: AdminUpdateTenantPayload }
    >({
        mutationFn: ({ id, payload }) => updateGlobalTenant(id, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: GLOBAL_TENANTS_QUERY_KEY })
            queryClient.invalidateQueries({
                queryKey: GLOBAL_TENANT_SUMMARY_QUERY_KEY,
            })
            queryClient.invalidateQueries({
                queryKey: [...GLOBAL_TENANT_DETAIL_QUERY_KEY, variables.id],
            })
        },
    })
}

/** Hook xóa tenant (soft delete) */
export function useDeleteGlobalTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, string>({
        mutationFn: deleteGlobalTenant,
        onSuccess: (_data, tenantId) => {
            queryClient.invalidateQueries({ queryKey: GLOBAL_TENANTS_QUERY_KEY })
            queryClient.invalidateQueries({
                queryKey: GLOBAL_TENANT_SUMMARY_QUERY_KEY,
            })
            queryClient.invalidateQueries({
                queryKey: [...GLOBAL_TENANT_DETAIL_QUERY_KEY, tenantId],
            })
        },
    })
}
