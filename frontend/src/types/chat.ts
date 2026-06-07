import type { ID, Timestamp } from './common'

/* ============================================================
   Chat — Type definitions
   ============================================================ */

export interface Conversation {
    id: ID
    title: string
    updatedAt: Timestamp
    createdAt: Timestamp
    lastMessage?: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
    id: ID
    conversationId: ID
    role: MessageRole
    content: string
    createdAt: Timestamp
}

export interface SendMessagePayload {
    conversationId: ID
    content: string
}

export interface CreateConversationPayload {
    title?: string
}

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
