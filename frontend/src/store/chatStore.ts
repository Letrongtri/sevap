import { create } from 'zustand'
import type { ChatStore } from '../types/chat'

/**
 * useChatStore — Zustand store cho CLIENT state của chức năng chat.
 *
 * Lưu ý: Dữ liệu từ server (danh sách conversations, messages) KHÔNG
 * nằm ở đây — chúng được quản lý bởi TanStack Query trong các hook
 * tương ứng (useConversations, useMessages, ...).
 */
export const useChatStore = create<ChatStore>((set) => ({
    // ── State ──────────────────────────────────────────────────────────
    activeChatId: null,
    searchKeyword: '',

    // ── Actions ────────────────────────────────────────────────────────

    /** Chọn conversation để xem */
    setActiveChat: (id) => set({ activeChatId: id }),

    /** Cập nhật từ khoá tìm kiếm conversation trong sidebar */
    setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

    /** Bỏ chọn conversation hiện tại */
    clearActiveChat: () => set({ activeChatId: null }),
}))
