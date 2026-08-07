import { create } from 'zustand'
import type { PromptTemplateStore } from '../types/promptTemplate'
import type { ID } from '../types/common'

export const usePromptTemplateStore = create<PromptTemplateStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingPromptTemplate: false,
    activePromptTemplateId: null,
    query: null,
    type: null,
    is_active: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    /** Set is adding prompt template */
    setIsAddingPromptTemplate: (isAddingPromptTemplate: boolean) =>
        set({ isAddingPromptTemplate }),

    /** Chọn prompt template để xem */
    setActivePromptTemplateId: (id: ID | null) =>
        set({ activePromptTemplateId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    /** Set is system */
    setType: (type: string | null) => set({ type: type }),

    setIsActive: (is_active: boolean | null) => set({ is_active: is_active }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number | null) => set({ limit: limit ?? 10 }),

    /** Bỏ chọn prompt hiện tại */
    clearActivePromptTemplate: () => set({ activePromptTemplateId: null }),
}))
