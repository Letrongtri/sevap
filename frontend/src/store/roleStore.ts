import { create } from 'zustand'
import type { RoleStore } from '../types/role'

export const useRoleStore = create<RoleStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingRole: false,
    activeRoleId: null,
    query: null,
    status: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    /** Set is adding role */
    setIsAddingRole: (isAddingRole: boolean) => set({ isAddingRole }),

    /** Chọn role để xem */
    setActiveRoleId: (id: number | null) => set({ activeRoleId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    /** Set is system */
    setStatus: (status: string | null) => set({ status: status }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number) => set({ limit }),

    /** Bỏ chọn role hiện tại */
    clearActiveRole: () => set({ activeRoleId: null }),
}))
