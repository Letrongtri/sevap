import { create } from 'zustand'
import type { DocumentStore } from '../types/document'
import type { AccessLevel, ID, Timestamp } from '../types/common'

export const useDocumentStore = create<DocumentStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingDocument: false,
    activeDocumentId: null,
    query: null,
    departmentId: null,
    accessLevel: null,
    effectiveDate: null,
    roleAccess: null,
    targetUserId: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────
    /** Set is adding document */
    setIsAddingDocument: (isAddingDocument: boolean) =>
        set({ isAddingDocument }),

    /** Chọn document để xem */
    setActiveDocumentId: (id: ID | null) => set({ activeDocumentId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    /** Set department ID */
    setDepartmentId: (departmentId: ID | null) => set({ departmentId }),

    /** Set access level */
    setAccessLevel: (accessLevel: AccessLevel | null) => set({ accessLevel }),

    /** Set effective date */
    setEffectiveDate: (effectiveDate: Timestamp | null) =>
        set({ effectiveDate }),

    /** Set role access */
    setRoleAccess: (roleAccess: ID | null) => set({ roleAccess }),

    /** Set target user IDs */
    setTargetUserId: (targetUserId: ID | null) => set({ targetUserId }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number | null) => set({ limit: limit ?? 10 }),

    /** Bỏ chọn document hiện tại */
    clearActiveDocument: () => set({ activeDocumentId: null }),
}))
