import axiosClient from './axios'
import type { RoleSimple } from '../types/role'

export const fetchAllSimpleRoles = async (): Promise<RoleSimple[]> => {
    const res = await axiosClient.get('/roles/simple')
    return res.data
}
