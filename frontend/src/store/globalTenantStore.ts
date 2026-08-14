import { create } from 'zustand'
import type { GlobalTenantStore } from '../types/tenant'
import type { ID } from '../types/common'

export const useGlobalTenantStore = create<GlobalTenantStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingTenant: false,
    activeTenantId: null,
    query: null,
    statusFilter: 'all',
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    setIsAddingTenant: (isAddingTenant: boolean) => set({ isAddingTenant }),

    setActiveTenantId: (id: ID | null) => set({ activeTenantId: id }),

    setQuery: (query: string | null) => set({ query }),

    setStatusFilter: (statusFilter: string | null) => set({ statusFilter }),

    setPage: (page: number | null) => set({ page: page ?? 1 }),

    setLimit: (limit: number | null) => set({ limit: limit ?? 10 }),

    clearActiveTenant: () => set({ activeTenantId: null, isAddingTenant: false }),
}))
