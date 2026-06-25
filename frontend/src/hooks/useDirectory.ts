import { useQuery } from '@tanstack/react-query'
import { fetchDirectoryOverview } from '../api/directory'
import { fetchUserOptions } from '../api/user'
import { fetchDepartments } from '../api/department'
import { fetchJobTitles } from '../api/jobTitle'
import { useDirectoryStore } from '../store/directoryStore'
import type { DirectoryOverview } from '../types/directory'

export function useDirectoryOverview() {
    return useQuery<DirectoryOverview>({
        queryKey: ['directory-overview'],
        queryFn: fetchDirectoryOverview,
    })
}

export function useDirectoryUsers(options?: { enabled?: boolean }) {
    const query = useDirectoryStore((s) => s.query)
    const page = useDirectoryStore((s) => s.page) || 1
    const limit = useDirectoryStore((s) => s.limit) || 10
    const departmentId = useDirectoryStore((s) => s.departmentId)
    const jobTitleId = useDirectoryStore((s) => s.jobTitleId)

    return useQuery({
        queryKey: [
            'directory-users',
            { query, page, limit, departmentId, jobTitleId },
        ],
        queryFn: () =>
            fetchUserOptions(
                query,
                page,
                limit,
                departmentId,
                jobTitleId,
                true,
                true
            ),
        enabled: options?.enabled,
    })
}

export function useDirectoryDepartments(options?: { enabled?: boolean }) {
    const query = useDirectoryStore((s) => s.query)
    const page = useDirectoryStore((s) => s.page) || 1
    const limit = useDirectoryStore((s) => s.limit) || 10

    return useQuery({
        queryKey: ['directory-departments', { query, page, limit }],
        queryFn: () => fetchDepartments({ query, page, limit }),
        enabled: options?.enabled,
    })
}

export function useDirectoryJobTitles(options?: { enabled?: boolean }) {
    const query = useDirectoryStore((s) => s.query)
    const page = useDirectoryStore((s) => s.page) || 1
    const limit = useDirectoryStore((s) => s.limit) || 10

    return useQuery({
        queryKey: ['directory-job-titles', { query, page, limit }],
        queryFn: () => fetchJobTitles({ query, page, limit }),
        enabled: options?.enabled,
    })
}
