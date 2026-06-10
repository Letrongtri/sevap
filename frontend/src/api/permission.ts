import type { Permission } from '../types/permission'
import axiosClient from './axios'

export const fetchPermissions = async (): Promise<Permission[]> => {
    const res = await axiosClient.get('/permissions')
    return res.data
}
