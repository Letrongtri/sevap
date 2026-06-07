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

/* ============================================================
   Streaming — SSE event types from /conversations/message
   ============================================================ */

/** Emitted right after user message is persisted. Carries IDs for optimistic UI. */
export interface MetadataEvent {
    type: 'metadata'
    conversationId: number
    userMessageId: number
}

/** One LLM token chunk. */
export interface TokenEvent {
    type: 'token'
    token: string
}

/** Stream finished successfully. */
export interface DoneEvent {
    type: 'done'
    assistantMessageId: number
    sources: Array<{ title: string; chunk_id: string | null }>
    agentType: string
}

/** No retrieval results — stream ends after this. */
export interface ErrorEvent {
    type: 'error'
    message: string
}

export type StreamEvent = MetadataEvent | TokenEvent | DoneEvent | ErrorEvent

/** Local UI state while a stream is in progress. */
export interface StreamingState {
    isStreaming: boolean
    /** ID of the conversation being streamed into (known after metadata event) */
    streamingConversationId: number | null
    /** Accumulated assistant answer as tokens arrive */
    streamingContent: string
}
