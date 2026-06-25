import { create } from 'zustand'
import type { DirectoryStore, DirectoryTab } from '../types/directory'

export const useDirectoryStore = create<DirectoryStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    activeTab: 'users',
    query: '',
    page: 1,
    limit: 10,
    departmentId: null,
    jobTitleId: null,

    // ── Actions ────────────────────────────────────────────────────────
    setActiveTab: (activeTab: DirectoryTab) =>
        set({
            activeTab,
            query: '',
            page: 1,
            departmentId: null,
            jobTitleId: null,
        }),
    setQuery: (query: string) => set({ query }),
    setPage: (page: number) => set({ page }),
    setLimit: (limit: number) => set({ limit }),
    setDepartmentId: (departmentId: string | null) => set({ departmentId }),
    setJobTitleId: (jobTitleId: string | null) => set({ jobTitleId }),
}))
