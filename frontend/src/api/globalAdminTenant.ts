import type {
    AdminCreateTenantPayload,
    AdminUpdateTenantPayload,
    Tenant,
    TenantPaginatedResponse,
    TenantQuery,
    TenantSummaryResponse,
} from '../types/tenant'
import axiosClient from './axios'

/** Lấy danh sách tenant theo filter và phân trang (dành cho Global Admin) */
export const fetchGlobalTenants = async (
    params: TenantQuery
): Promise<TenantPaginatedResponse> => {
    const cleanParams: Record<string, any> = {}
    if (params.query) cleanParams.query = params.query.trim()
    if (params.status && params.status !== 'all')
        cleanParams.status = params.status
    if (params.page) cleanParams.page = params.page
    if (params.limit) cleanParams.limit = params.limit

    const res = await axiosClient.get('/global-admin/tenants', {
        params: cleanParams,
    })
    return res.data
}

/** Lấy thông tin chi tiết tenant theo ID (dành cho Global Admin) */
export const fetchGlobalTenantById = async (
    tenantId: string
): Promise<Tenant> => {
    const res = await axiosClient.get(`/global-admin/tenants/${tenantId}`)
    return res.data
}

/** Tạo tenant mới từ phía Global Admin */
export const createGlobalTenant = async (
    payload: AdminCreateTenantPayload
): Promise<Tenant> => {
    const domainTrimmed = payload.tenant_domain.trim()
    const tenantDomain = domainTrimmed.endsWith('.sevap.com')
        ? domainTrimmed
        : `${domainTrimmed}.sevap.com`

    const res = await axiosClient.post('/global-admin/tenants', {
        ...payload,
        tenant_domain: tenantDomain,
    })
    return res.data
}

/** Cập nhật tenant từ phía Global Admin */
export const updateGlobalTenant = async (
    tenantId: string,
    payload: AdminUpdateTenantPayload
): Promise<Tenant> => {
    let tenantDomain = payload.tenant_domain
    if (tenantDomain) {
        const domainTrimmed = tenantDomain.trim()
        tenantDomain = domainTrimmed.endsWith('.sevap.com')
            ? domainTrimmed
            : `${domainTrimmed}.sevap.com`
    }

    const res = await axiosClient.put(`/global-admin/tenants/${tenantId}`, {
        ...payload,
        tenant_domain: tenantDomain || undefined,
    })
    return res.data
}

/** Xóa (Soft delete) tenant (dành cho Global Admin) */
export const deleteGlobalTenant = async (
    tenantId: string
): Promise<Tenant> => {
    const res = await axiosClient.delete(`/global-admin/tenants/${tenantId}`)
    return res.data
}

/** Lấy thống kê tổng quan tenant (Global Admin Dashboard Summary) */
export const fetchTenantSummary = async (): Promise<TenantSummaryResponse> => {
    const res = await axiosClient.get('/global-admin/dashboard/tenants/summary')
    return res.data
}
