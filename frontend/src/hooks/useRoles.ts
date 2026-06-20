import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoleStore } from '../store/roleStore'
import type { Role, RolePaginatedResponse } from '../types/role'
import { createRole, deleteRole, fetchRoles, updateRole } from '../api/role'
import type { ID } from '../types/common'

export const ROLES_QUERY_KEY = ['roles'] as const

export function useRoles() {
    const querySearch = useRoleStore((s) => s.query)
    const status = useRoleStore((s) => s.status)
    const page = useRoleStore((s) => s.page)
    const limit = useRoleStore((s) => s.limit)

    // Chuẩn hoá status: 'all' hoặc rỗng thì truyền null cho API
    const isSystemParam =
        status === 'all' || !status ? null : status === 'system'

    const queryKey = [
        ...ROLES_QUERY_KEY,
        {
            querySearch,
            isSystemParam,
            page,
            limit,
        },
    ] as const

    const query = useQuery<RolePaginatedResponse>({
        queryKey,
        queryFn: () => fetchRoles(querySearch, isSystemParam, page, limit),
    })

    return {
        ...query,
        roles: query.data?.roles ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook tạo vai trò mới */
export function useCreateRole() {
    const queryClient = useQueryClient()
    return useMutation<Role, Error, Parameters<typeof createRole>[0]>({
        mutationFn: createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin role */
export function useUpdateRole() {
    const queryClient = useQueryClient()
    return useMutation<
        Role,
        Error,
        { id: ID; payload: Parameters<typeof updateRole>[1] }
    >({
        mutationFn: ({ id, payload }) => updateRole(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
        },
    })
}

/** Hook xoá role */
export function useDeleteRole() {
    const queryClient = useQueryClient()
    return useMutation<Role, Error, ID>({
        mutationFn: deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
        },
    })
}
