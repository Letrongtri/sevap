import axiosClient from './axios'
import type {
    DepartmentPaginatedResponse,
    DepartmentQuery,
    DepartmentSimple,
} from '../types/department'

export const fetchAllSimpleDepartments = async (): Promise<
    DepartmentSimple[]
> => {
    const res = await axiosClient.get('/departments/simple')
    return res.data
}

export const fetchDepartments = async (
    query: DepartmentQuery
): Promise<DepartmentPaginatedResponse> => {
    const response = await axiosClient.get(`/departments`, {
        params: {
            query: query.query,
            page: query.page,
            limit: query.limit,
        },
    })
    return response.data
}
