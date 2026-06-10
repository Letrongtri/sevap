import { create } from 'zustand'
import type { UserStore } from '../types/user'

/**
 * useUserStore — Zustand store cho CLIENT state của chức năng user.
 *
 * Lưu ý: Dữ liệu từ server (danh sách users, ...) KHÔNG
 * nằm ở đây — chúng được quản lý bởi TanStack Query trong các hook
 * tương ứng (useConversations, useMessages, ...).
 */
export const useUserStore = create<UserStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    isAddingUser: false,
    activeUserId: null,
    query: null,
    departmentId: null,
    jobTitleId: null,
    roleId: null,
    status: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────

    /** Set trạng thái đang thêm user */
    setIsAddingUser: (isAddingUser: boolean) => set({ isAddingUser }),

    /** Chọn user để xem */
    setActiveUserId: (id: number | null) => set({ activeUserId: id }),

    /** Set query search */
    setQuery: (query: string | null) => set({ query: query }),

    /** Set department id */
    setDepartmentId: (id: number | null) => set({ departmentId: id }),

    setJobTitleId: (id: number | null) => set({ jobTitleId: id }),

    setRoleId: (id: number | null) => set({ roleId: id }),

    setStatus: (status: string | null) => set({ status }),

    setPage: (page: number | null) => set({ page }),

    setLimit: (limit: number) => set({ limit }),

    /** Bỏ chọn user hiện tại */
    clearActiveUser: () => set({ activeUserId: null }),
}))
