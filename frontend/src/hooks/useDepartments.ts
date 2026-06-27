import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDepartmentStore } from '../store/departmentStore'
import type {
    Department,
    DepartmentPaginatedResponse,
    DepartmentQuery,
} from '../types/department'
import {
    createDepartment,
    deleteDepartment,
    fetchDepartments,
    updateDepartment,
} from '../api/department'
import type { ID } from '../types/common'

export const DEPARTMENTS_QUERY_KEY = ['departments'] as const

export function useDepartments() {
    const querySearch = useDepartmentStore((s) => s.query)
    const page = useDepartmentStore((s) => s.page)
    const limit = useDepartmentStore((s) => s.limit)

    const queryParams: DepartmentQuery = {
        query: querySearch,
        page,
        limit,
    }

    const queryKey = [
        ...DEPARTMENTS_QUERY_KEY,
        {
            querySearch,
            page,
            limit,
        },
    ] as const

    const query = useQuery<DepartmentPaginatedResponse>({
        queryKey,
        queryFn: () => fetchDepartments(queryParams),
    })

    return {
        ...query,
        departments: query.data?.departments ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook tạo phòng ban mới */
export function useCreateDepartment() {
    const queryClient = useQueryClient()
    return useMutation<
        Department,
        Error,
        Parameters<typeof createDepartment>[0]
    >({
        mutationFn: createDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin phòng ban */
export function useUpdateDepartment() {
    const queryClient = useQueryClient()
    return useMutation<
        Department,
        Error,
        { id: ID; payload: Parameters<typeof updateDepartment>[1] }
    >({
        mutationFn: ({ id, payload }) => updateDepartment(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
        },
    })
}

/** Hook xoá phòng ban */
export function useDeleteDepartment() {
    const queryClient = useQueryClient()
    return useMutation<Department, Error, ID>({
        mutationFn: deleteDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY })
        },
    })
}
