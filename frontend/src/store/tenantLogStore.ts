import { create } from 'zustand'
import type { TenantLogStore } from '../types/tenantLog'
import type { ID } from '../types/common'

export const useTenantLogStore = create<TenantLogStore>((set) => ({
    activeTenantLogId: null,
    filters: {
        user_id: null,
        action: null,
        resource: null,
        log_level: null,
        start_date: null,
        end_date: null,
        page: null,
        limit: null,
        sort_by: null,
        sort_order: 'desc',
    },

    setActiveTenantLogId: (tenantLogId: ID | null) =>
        set({ activeTenantLogId: tenantLogId }),

    setUserId: (user_id: string | null) =>
        set((state) => ({ filters: { ...state.filters, user_id } })),

    setAction: (action: string | null) =>
        set((state) => ({ filters: { ...state.filters, action } })),

    setResource: (resource: string | null) =>
        set((state) => ({ filters: { ...state.filters, resource } })),

    setLogLevel: (log_level: string | null) =>
        set((state) => ({ filters: { ...state.filters, log_level } })),

    setStartDate: (start_date: string | null) =>
        set((state) => ({ filters: { ...state.filters, start_date } })),

    setEndDate: (end_date: string | null) =>
        set((state) => ({ filters: { ...state.filters, end_date } })),

    setPage: (page: number | null) =>
        set((state) => ({ filters: { ...state.filters, page } })),

    setLimit: (limit: number | null) =>
        set((state) => ({ filters: { ...state.filters, limit } })),

    setSortBy: (sort_by: string | null) =>
        set((state) => ({ filters: { ...state.filters, sort_by } })),

    setSortOrder: (sort_order: 'asc' | 'desc' | null) =>
        set((state) => ({
            filters: { ...state.filters, sort_order: sort_order ?? 'desc' },
        })),

    clearFilters: () =>
        set(() => ({
            filters: {
                user_id: null,
                action: null,
                resource: null,
                log_level: null,
                start_date: null,
                end_date: null,
                page: null,
                limit: null,
                sort_by: null,
                sort_order: 'desc',
            },
        })),
}))
