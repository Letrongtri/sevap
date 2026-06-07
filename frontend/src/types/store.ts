/* ============================================================
   Chat — Client-only state (server state lives in TanStack Query)
   ============================================================ */

export interface ChatClientState {
    /** ID của conversation đang được xem, null nếu chưa chọn */
    activeChatId: number | null
    /** Từ khoá tìm kiếm trong sidebar history */
    searchKeyword: string
}

export interface ChatClientActions {
    setActiveChat: (id: number | null) => void
    setSearchKeyword: (keyword: string) => void
    clearActiveChat: () => void
}

export type ChatStore = ChatClientState & ChatClientActions
