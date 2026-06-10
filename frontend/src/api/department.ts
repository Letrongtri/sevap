import axiosClient from './axios'
import type { DepartmentSimple } from '../types/department'

export const fetchAllSimpleDepartments = async (): Promise<
    DepartmentSimple[]
> => {
    const res = await axiosClient.get('/departments/simple')
    return res.data
}
