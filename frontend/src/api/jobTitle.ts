import axiosClient from './axios'
import type { JobTitleSimple } from '../types/jobTitle'

export const fetchAllSimpleJobTitles = async (): Promise<JobTitleSimple[]> => {
    const res = await axiosClient.get('/job_titles/simple')
    return res.data
}
