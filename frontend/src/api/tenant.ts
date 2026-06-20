import type {
    AddTenantPayload,
    Tenant,
    UpdateTenantPayload,
} from '../types/tenant'
import axiosClient from './axios'

export const registerTenant = async (
    payload: AddTenantPayload
): Promise<Tenant> => {
    const res = await axiosClient.post('/tenants/register', payload)
    return res.data
}

/** Cập nhật thông tin tenant */
export const updateTenant = async (
    payload: UpdateTenantPayload
): Promise<Tenant> => {
    const res = await axiosClient.put(`/tenants`, payload)
    return res.data
}

/** Xoá tenant */
export const deleteTenant = async (): Promise<Tenant> => {
    const res = await axiosClient.delete(`/tenants`)
    return res.data
}
