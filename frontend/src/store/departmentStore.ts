import { create } from 'zustand'
import type { DepartmentStore } from '../types/department'
import type { ID } from '../types/common'

export const useDepartmentStore = create<DepartmentStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingDepartment: false,
    activeDepartmentId: null,
    query: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    /** Set is adding department */
    setIsAddingDepartment: (isAddingDepartment: boolean) =>
        set({ isAddingDepartment }),

    /** Chọn department để xem */
    setActiveDepartmentId: (id: ID | null) => set({ activeDepartmentId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number | null) => set({ limit: limit ?? 10 }),

    /** Bỏ chọn department hiện tại */
    clearActiveDepartment: () => set({ activeDepartmentId: null }),
}))
