import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    resetUserPassword,
} from '../api/user'
import { useUserStore } from '../store/usersStore'
import type { User, UserPaginatedResponse } from '../types/user'
import type { ID } from '../types/common'

export const USERS_QUERY_KEY = ['users'] as const

/**
 * useUsers — Fetch và cache danh sách users từ server.
 *
 * - Server state được quản lý bởi TanStack Query (cache, refetch, loading).
 * - Tự động refetch khi các state tìm kiếm/phân trang trong Zustand thay đổi.
 */
export function useUsers() {
    const querySearch = useUserStore((s) => s.query)
    const departmentId = useUserStore((s) => s.departmentId)
    const jobTitleId = useUserStore((s) => s.jobTitleId)
    const roleId = useUserStore((s) => s.roleId)
    const status = useUserStore((s) => s.status)
    const page = useUserStore((s) => s.page)
    const limit = useUserStore((s) => s.limit)

    // Chuẩn hoá status: 'all' hoặc rỗng thì truyền null cho API
    const statusParam = status === 'all' || !status ? null : status

    const queryKey = [
        ...USERS_QUERY_KEY,
        {
            querySearch,
            departmentId,
            jobTitleId,
            roleId,
            status: statusParam,
            page,
            limit,
        },
    ] as const

    const query = useQuery<UserPaginatedResponse>({
        queryKey,
        queryFn: () =>
            fetchUsers(
                querySearch,
                departmentId,
                jobTitleId,
                roleId,
                statusParam,
                page,
                limit
            ),
    })

    return {
        ...query,
        users: query.data?.users ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook tạo người dùng mới */
export function useCreateUser() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, Parameters<typeof createUser>[0]>({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin người dùng */
export function useUpdateUser() {
    const queryClient = useQueryClient()
    return useMutation<
        User,
        Error,
        { id: ID; payload: Parameters<typeof updateUser>[1] }
    >({
        mutationFn: ({ id, payload }) => updateUser(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
        },
    })
}

/** Hook kích hoạt hoặc vô hiệu hoá người dùng */
export function useToggleUserStatus() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, { id: ID; active: boolean }>({
        mutationFn: ({ id, active }) =>
            active ? activateUser(id) : deactivateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
        },
    })
}

/** Hook xoá người dùng */
export function useDeleteUser() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, ID>({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
        },
    })
}

/** Hook đặt lại mật khẩu */
export function useResetUserPassword() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, ID>({
        mutationFn: resetUserPassword,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
        },
    })
}
