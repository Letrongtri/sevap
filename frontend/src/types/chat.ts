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

/** actor: 'user' | 'assistant' | agent names — mirrors backend MessageResponse.actor */
export type MessageActor = string

export interface Message {
    id: ID
    conversationId: ID
    /** actor = 'user' → người dùng; còn lại → bot/agent */
    actor: MessageActor
    agentType?: string | null
    content: string
    createdAt: Timestamp
}

/** Response từ GET /conversations/{id} — bao gồm messages (10 cuối) */
export interface ConversationDetail extends Conversation {
    userId: ID
    isDeleted: boolean
    messages: Message[]
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
    activeChatId: ID | null
    /** Từ khoá tìm kiếm trong sidebar history */
    searchKeyword: string
    /** Tin nhắn ban đầu truyền từ Home page sang Chat page */
    initialMessage: string | null
}

export interface ChatClientActions {
    setActiveChat: (id: ID | null) => void
    setSearchKeyword: (keyword: string) => void
    clearActiveChat: () => void
    setInitialMessage: (message: string | null) => void
}

export type ChatStore = ChatClientState & ChatClientActions

/* ============================================================
   Streaming — SSE event types from /conversations/message
   ============================================================ */

/** Emitted right after user message is persisted. Carries IDs for optimistic UI. */
export interface MetadataEvent {
    type: 'metadata'
    conversationId: ID
    userMessageId: ID
}

/** One LLM token chunk. */
export interface TokenEvent {
    type: 'token'
    token: string
}

/** Stream finished successfully. */
export interface DoneEvent {
    type: 'done'
    assistantMessageId: ID
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
    streamingConversationId: ID | null
    /** Accumulated assistant answer as tokens arrive */
    streamingContent: string
}
