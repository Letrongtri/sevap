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
    initialMessage: null,
    page: 1,
    limit: 10,

    // ── Actions ────────────────────────────────────────────────────────

    /** Chọn conversation để xem */
    setActiveChat: (id) => set({ activeChatId: id }),

    /** Cập nhật từ khoá tìm kiếm conversation trong sidebar */
    setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

    /** Bỏ chọn conversation hiện tại */
    clearActiveChat: () => set({ activeChatId: null }),

    /** Lưu tin nhắn đầu tiên khi chuyển từ Home sang Chat */
    setInitialMessage: (message) => set({ initialMessage: message }),

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit }),
}))
