import { create } from 'zustand'
import type {
    ChatStatsGroupBy,
    TenantAdminDashboardStore,
} from '../types/tenantAdminDashboard'

export const useTenantAdminDashboardStore = create<TenantAdminDashboardStore>(
    (set) => ({
        // ── State ──────────────────────────────────────────────────────────
        isEditingTenant: false,
        chatStatsGroupBy: 'date',
        chatStatsFromDate: undefined,
        chatStatsToDate: undefined,

        // ── Actions ────────────────────────────────────────────────────────

        setIsEditingTenant: (isEditingTenant: boolean) =>
            set({ isEditingTenant }),
        setChatStatsGroupBy: (chatStatsGroupBy: ChatStatsGroupBy) =>
            set({ chatStatsGroupBy }),
        setChatStatsFromDate: (chatStatsFromDate?: string) =>
            set({ chatStatsFromDate }),
        setChatStatsToDate: (chatStatsToDate?: string) =>
            set({ chatStatsToDate }),
    })
)
