import axiosClient from './axios'
import type {
    AddJobTitlePayload,
    JobTitle,
    JobTitlePaginatedResponse,
    JobTitleQuery,
    JobTitleSimple,
    UpdateJobTitlePayload,
} from '../types/jobTitle'
import type { ID } from '../types/common'

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

export const fetchJobTitleById = async (id: ID): Promise<JobTitle> => {
    const res = await axiosClient.get(`/job_titles/${id}`)
    return res.data
}

export const createJobTitle = async (
    payload: AddJobTitlePayload
): Promise<JobTitle> => {
    const res = await axiosClient.post('/job_titles', payload)
    return res.data
}

export const updateJobTitle = async (
    id: ID,
    payload: UpdateJobTitlePayload
): Promise<JobTitle> => {
    const res = await axiosClient.patch(`/job_titles/${id}`, payload)
    return res.data
}

export const deleteJobTitle = async (id: ID): Promise<JobTitle> => {
    const res = await axiosClient.delete(`/job_titles/${id}`)
    return res.data
}
