import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    resetUserPassword,
    updateMyProfile,
    changeMyPassword,
    fetchMyProfile,
    fetchMyUserSessions,
} from '../api/user'
import { useUserStore } from '../store/usersStore'
import type { User, UserPaginatedResponse } from '../types/user'
import type {
    ChangeMyPasswordPayload,
    UpdateMyProfilePayload,
} from '../types/myProfile'
import type { ID } from '../types/common'
import type { UserSessionPaginatedResponse } from '../types/myProfile'

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: object) => [...userKeys.lists(), filters] as const,

    me: ['user-me'] as const,
    myProfile: () => [...userKeys.me, 'profile'] as const,
    mySessions: () => [...userKeys.me, 'sessions'] as const,
}

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

    const filters = {
        querySearch,
        departmentId,
        jobTitleId,
        roleId,
        status: statusParam,
        page,
        limit,
    }

    const query = useQuery<UserPaginatedResponse>({
        queryKey: userKeys.list(filters),
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
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
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
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
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
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

/** Hook xoá người dùng */
export function useDeleteUser() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, ID>({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

/** Hook đặt lại mật khẩu */
export function useResetUserPassword() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, ID>({
        mutationFn: resetUserPassword,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export function useMyProfile() {
    return useQuery<User>({
        queryKey: userKeys.myProfile(),
        queryFn: () => fetchMyProfile(),
    })
}

/** Hook cập nhật thông tin cá nhân */
export function useUpdateMyProfile() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, { payload: UpdateMyProfilePayload }>({
        mutationFn: ({ payload }) => updateMyProfile(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.myProfile() })
        },
    })
}

/** Hook cập nhật mật khẩu cá nhân */
export function useChangeMyPassword() {
    const queryClient = useQueryClient()
    return useMutation<User, Error, { payload: ChangeMyPasswordPayload }>({
        mutationFn: ({ payload }) => changeMyPassword(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.me })
        },
    })
}

export function useMyUserSessions() {
    return useQuery<UserSessionPaginatedResponse>({
        queryKey: userKeys.mySessions(),
        queryFn: () => fetchMyUserSessions(),
    })
}
