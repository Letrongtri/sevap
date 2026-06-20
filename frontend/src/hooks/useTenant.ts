import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tenant } from '../types/tenant'
import { deleteTenant, registerTenant, updateTenant } from '../api/tenant'

export const TENANTS_QUERY_KEY = ['tenants'] as const

/** Hook tạo tenant mới */
export function useRegisterTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, Parameters<typeof registerTenant>[0]>({
        mutationFn: registerTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin tenant */
export function useUpdateTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, Parameters<typeof updateTenant>[0]>({
        mutationFn: updateTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
        },
    })
}

/** Hook xoá tenant */
export function useDeleteTenant() {
    const queryClient = useQueryClient()
    return useMutation<Tenant, Error, void>({
        mutationFn: deleteTenant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
        },
    })
}
