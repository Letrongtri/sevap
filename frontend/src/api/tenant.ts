import type {
    AddTenantPayload,
    Tenant,
    UpdateTenantPayload,
} from '../types/tenant'
import axiosClient from './axios'

export const registerTenant = async (
    payload: AddTenantPayload
): Promise<Tenant> => {
    const tenantDomain = payload.tenant_domain.trim().endsWith('.sevap.com')
        ? payload.tenant_domain.trim()
        : `${payload.tenant_domain.trim()}.sevap.com`

    const res = await axiosClient.post('/tenants/register', {
        ...payload,
        tenant_domain: tenantDomain,
    })
    return res.data
}

/** Lấy thông tin tenant */
export const getTenantInfo = async (): Promise<Tenant> => {
    const res = await axiosClient.get(`/tenants/info`)
    return res.data
}

/** Cập nhật thông tin tenant */
export const updateTenant = async (
    payload: UpdateTenantPayload
): Promise<Tenant> => {
    const tenantDomain = payload.tenant_domain
        ? payload.tenant_domain.trim().endsWith('.sevap.com')
            ? payload.tenant_domain.trim()
            : `${payload.tenant_domain.trim()}.sevap.com`
        : undefined

    const res = await axiosClient.put(`/tenants`, {
        ...payload,
        tenant_domain: tenantDomain,
    })
    return res.data
}

/** Xoá tenant */
export const deleteTenant = async (): Promise<Tenant> => {
    const res = await axiosClient.delete(`/tenants`)
    return res.data
}
