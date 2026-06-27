import type { ID, Timestamp } from './common'

export interface Tenant {
    id: ID
    tenant_domain: string
    company_name: string
    company_description: string | null
    company_email: string
    company_phone: string
    company_address: string
    status: string
    created_at: Timestamp
    updated_at: Timestamp
}

export interface TenantSimple {
    id: ID
    tenant_domain: string
    company_name: string
}

export interface AddTenantPayload {
    // Tenant details
    tenant_domain: string
    company_name: string
    company_description: string | null
    company_email: string
    company_phone: string
    company_address: string

    // Tenant first Admin details
    admin_employee_code: string
    admin_full_name: string
    admin_email: string | null
    admin_password: string
}

export interface UpdateTenantPayload {
    id: ID
    tenant_domain?: string | null
    company_name?: string | null
    company_description?: string | null
    company_email?: string | null
    company_phone?: string | null
    company_address?: string | null
    status?: string | null
}

export interface TenantState {
    tenants: Tenant[]
    activeTenantId: ID | null
    isLoading: boolean
    error: string | null
}

export interface TenantActions {
    setTenants: (tenants: Tenant[]) => void
    setActiveTenantId: (id: ID | null) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export type TenantStore = TenantState & TenantActions
