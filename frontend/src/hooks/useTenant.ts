import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tenant } from '../types/tenant'
import {
    deleteTenant,
    getTenantInfo,
    registerTenant,
    updateTenant,
} from '../api/tenant'

export const MY_TENANT_QUERY_KEY = ['my-tenant'] as const

/** Hook tạo tenant mới */
export function useRegisterTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, Parameters<typeof registerTenant>[0]>({
        mutationFn: registerTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_TENANT_QUERY_KEY })
        },
    })
}

/** Hook lấy thông tin tenant */
export function useGetTenantInfo() {
    return useQuery<Tenant>({
        queryKey: MY_TENANT_QUERY_KEY,
        queryFn: getTenantInfo,
    })
}

/** Hook cập nhật thông tin tenant */
export function useUpdateTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, Parameters<typeof updateTenant>[0]>({
        mutationFn: updateTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_TENANT_QUERY_KEY })
        },
    })
}

/** Hook xoá tenant */
export function useDeleteTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, void>({
        mutationFn: deleteTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_TENANT_QUERY_KEY })
        },
    })
}
