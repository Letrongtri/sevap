import axiosClient from './axios'
import type {
    AddRolePayload,
    Role,
    RolePaginatedResponse,
    RoleSimple,
    UpdateRolePayload,
} from '../types/role'

export const fetchAllSimpleRoles = async (): Promise<RoleSimple[]> => {
    const res = await axiosClient.get('/roles/simple')
    return res.data
}

export const fetchRoles = async (
    query?: string | null,
    isSystem?: boolean | null,
    page?: number | null,
    limit: number = 10
): Promise<RolePaginatedResponse> => {
    const res = await axiosClient.get('/roles', {
        params: {
            query,
            is_system: isSystem,
            page,
            limit,
        },
    })
    return res.data
}

export const fetchRoleById = async (id: number): Promise<Role> => {
    const res = await axiosClient.get(`/roles/${id}`)
    return res.data
}

export const createRole = async (payload: AddRolePayload): Promise<Role> => {
    const res = await axiosClient.post('/roles', payload)
    return res.data
}

export const updateRole = async (
    id: number,
    payload: UpdateRolePayload
): Promise<Role> => {
    const res = await axiosClient.patch(`/roles/${id}`, payload)
    return res.data
}

export const deleteRole = async (id: number): Promise<Role> => {
    const res = await axiosClient.delete(`/roles/${id}`)
    return res.data
}
