import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useJobTitleStore } from '../store/jobTitleStore'
import type {
    JobTitle,
    JobTitlePaginatedResponse,
    JobTitleQuery,
} from '../types/jobTitle'
import {
    createJobTitle,
    deleteJobTitle,
    fetchJobTitles,
    updateJobTitle,
} from '../api/jobTitle'
import type { ID } from '../types/common'

export const JOB_TITLES_QUERY_KEY = ['job_titles'] as const

export function useJobTitles() {
    const querySearch = useJobTitleStore((s) => s.query)
    const page = useJobTitleStore((s) => s.page)
    const limit = useJobTitleStore((s) => s.limit)

    const queryParams: JobTitleQuery = {
        query: querySearch,
        page,
        limit,
    }

    const queryKey = [
        ...JOB_TITLES_QUERY_KEY,
        {
            querySearch,
            page,
            limit,
        },
    ] as const

    const query = useQuery<JobTitlePaginatedResponse>({
        queryKey,
        queryFn: () => fetchJobTitles(queryParams),
    })

    return {
        ...query,
        jobTitles: query.data?.job_titles ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook tạo chức vụ mới */
export function useCreateJobTitle() {
    const queryClient = useQueryClient()
    return useMutation<JobTitle, Error, Parameters<typeof createJobTitle>[0]>({
        mutationFn: createJobTitle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: JOB_TITLES_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin chức vụ */
export function useUpdateJobTitle() {
    const queryClient = useQueryClient()
    return useMutation<
        JobTitle,
        Error,
        { id: ID; payload: Parameters<typeof updateJobTitle>[1] }
    >({
        mutationFn: ({ id, payload }) => updateJobTitle(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: JOB_TITLES_QUERY_KEY })
        },
    })
}

/** Hook xoá chức vụ */
export function useDeleteJobTitle() {
    const queryClient = useQueryClient()
    return useMutation<JobTitle, Error, ID>({
        mutationFn: deleteJobTitle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: JOB_TITLES_QUERY_KEY })
        },
    })
}
