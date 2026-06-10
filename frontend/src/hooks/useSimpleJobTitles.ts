import { useQuery } from '@tanstack/react-query'
import type { JobTitleSimple } from '../types/jobTitle'
import { fetchAllSimpleJobTitles } from '../api/jobTitle'

/** Hook lấy danh sách job titles */
export function useSimpleJobTitles() {
    return useQuery<JobTitleSimple[]>({
        queryKey: ['simple-job-titles'],
        queryFn: fetchAllSimpleJobTitles,
    })
}
