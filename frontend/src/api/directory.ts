import type { DirectoryOverview } from '../types/directory'
import axiosClient from './axios'

export const fetchDirectoryOverview = async (): Promise<DirectoryOverview> => {
    const res = await axiosClient.get('/directory/overview')
    return res.data
}
