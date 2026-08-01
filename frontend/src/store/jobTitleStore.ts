import { create } from 'zustand'
import type { JobTitleStore } from '../types/jobTitle'
import type { ID } from '../types/common'

export const useJobTitleStore = create<JobTitleStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingJobTitle: false,
    activeJobTitleId: null,
    query: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    /** Set is adding job title */
    setIsAddingJobTitle: (isAddingJobTitle: boolean) =>
        set({ isAddingJobTitle }),

    /** Chọn job title để xem */
    setActiveJobTitleId: (id: ID | null) => set({ activeJobTitleId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number | null) => set({ limit: limit ?? 10 }),

    /** Bỏ chọn job title hiện tại */
    clearActiveJobTitle: () => set({ activeJobTitleId: null }),
}))
