import axiosClient from './axios'
import type {
    Department,
    DepartmentPaginatedResponse,
    DepartmentQuery,
    DepartmentSimple,
    AddDepartmentPayload,
    UpdateDepartmentPayload,
} from '../types/department'
import type { ID } from '../types/common'

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

export const fetchDepartmentById = async (id: ID): Promise<Department> => {
    const res = await axiosClient.get(`/departments/${id}`)
    return res.data
}

export const createDepartment = async (
    payload: AddDepartmentPayload
): Promise<Department> => {
    const res = await axiosClient.post('/departments', payload)
    return res.data
}

export const updateDepartment = async (
    id: ID,
    payload: UpdateDepartmentPayload
): Promise<Department> => {
    const res = await axiosClient.patch(`/departments/${id}`, payload)
    return res.data
}

export const deleteDepartment = async (id: ID): Promise<Department> => {
    const res = await axiosClient.delete(`/departments/${id}`)
    return res.data
}
