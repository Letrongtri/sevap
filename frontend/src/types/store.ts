/* ============================================================
   Chat — Client-only state (server state lives in TanStack Query)
   ============================================================ */

import type { ID } from './common'

export interface ChatClientState {
    /** ID của conversation đang được xem, null nếu chưa chọn */
    activeChatId: ID | null
    /** Từ khoá tìm kiếm trong sidebar history */
    searchKeyword: string
}

export interface ChatClientActions {
    setActiveChat: (id: ID | null) => void
    setSearchKeyword: (keyword: string) => void
    clearActiveChat: () => void
}

export type ChatStore = ChatClientState & ChatClientActions
