import axiosClient from './axios'
import type {
    JobTitlePaginatedResponse,
    JobTitleQuery,
    JobTitleSimple,
} from '../types/jobTitle'

export const fetchAllSimpleJobTitles = async (): Promise<JobTitleSimple[]> => {
    const res = await axiosClient.get('/job_titles/simple')
    return res.data
}

export const fetchJobTitles = async (
    query: JobTitleQuery
): Promise<JobTitlePaginatedResponse> => {
    const response = await axiosClient.get(`/job_titles`, {
        params: {
            query: query.query,
            page: query.page,
            limit: query.limit,
        },
    })
    return response.data
}
