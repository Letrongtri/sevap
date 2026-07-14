import axiosClient from './axios'
import { useAuthStore } from '../store/authStore'
import type {
    Conversation,
    ConversationDetail,
    Message,
    SendMessagePayload,
    CreateConversationPayload,
    StreamEvent,
    ConversationPaginatedResponse,
    ConversationQuery,
} from '../types/chat'
import type { ID } from '../types/common'

const API_BASE = 'http://localhost:8000/api/v1'

/* ============================================================
   Conversations
   ============================================================ */

/** Lấy danh sách tất cả conversations của user hiện tại */
export const fetchConversations = async (
    query: ConversationQuery
): Promise<ConversationPaginatedResponse> => {
    const res = await axiosClient.get('/conversations', {
        params: {
            query: query.query,
            page: query.page,
            limit: query.limit,
        },
    })
    const d = res.data
    return {
        conversations:
            d?.conversations?.map((conv) => ({
                id: conv.id,
                title: conv.title,
                createdAt: conv.created_at,
                updatedAt: conv.updated_at,
            })) ?? [],
        pagination: d.pagination,
    }
}

/** Tạo conversation mới */
export const createConversation = async (
    payload: CreateConversationPayload
): Promise<Conversation> => {
    const res = await axiosClient.post('/conversations', payload)
    const d = res.data
    return {
        id: d.id,
        title: d.title,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
    }
}

/** Xoá một conversation */
export const deleteConversation = async (id: ID): Promise<void> => {
    await axiosClient.delete(`/conversations/${id}`)
}

/**
 * Lấy chi tiết conversation + 10 messages cuối.
 * Dùng cho lần đầu mở chat (initial load).
 */
export const fetchConversationDetail = async (
    id: ID
): Promise<ConversationDetail> => {
    const res = await axiosClient.get(`/conversations/${id}`)
    // Backend trả về snake_case, map sang camelCase
    const d = res.data
    return {
        id: d.id,
        userId: d.user_id,
        title: d.title,
        isDeleted: d.is_deleted,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        messages: (d.messages ?? []).map(mapMessage),
    }
}

/** Lấy thêm messages cũ hơn (cursor-based pagination ngược) */
export const fetchMoreMessages = async (
    conversationId: ID,
    lastId: ID,
    limit = 20
): Promise<Message[]> => {
    const res = await axiosClient.get(
        `/conversations/${conversationId}/messages`,
        { params: { last_id: lastId, limit } }
    )
    return (res.data ?? []).map(mapMessage)
}

/** Map từ backend snake_case sang frontend camelCase */
function mapMessage(m: Record<string, unknown>): Message {
    return {
        id: m.id as ID,
        conversationId: m.conversation_id as ID,
        actor: m.actor as string,
        agentType: (m.agent_type as string | null) ?? null,
        content: m.content as string,
        createdAt: m.created_at as string,
    }
}

/** Lấy danh sách messages của một conversation (legacy) */
export const fetchMessages = async (conversationId: ID): Promise<Message[]> => {
    const res = await axiosClient.get(
        `/conversations/${conversationId}/messages`
    )
    return (res.data ?? []).map(mapMessage)
}

/** Gửi một tin nhắn vào conversation (non-streaming, légacy) */
export const sendMessage = async (
    payload: SendMessagePayload
): Promise<Message> => {
    const { conversationId, content } = payload
    const res = await axiosClient.post(
        `/conversations/${conversationId}/messages`,
        { content }
    )
    return mapMessage(res.data)
}

/**
 * streamMessage — Gửi câu hỏi và nhận câu trả lời dạng SSE.
 *
 * Yields các `StreamEvent` theo thứ tự:
 *   1. { type: 'metadata', conversationId, userMessageId }
 *   2. { type: 'token',    token: string }  (một hoặc nhiều lần)
 *   3. { type: 'done',     assistantMessageId, sources, agentType }
 *      hoặc
 *      { type: 'error',    message: string }
 */
export async function* streamMessage(payload: {
    content: string
    conversationId?: ID | null
}): AsyncGenerator<StreamEvent> {
    const { accessToken } = useAuthStore.getState()

    const response = await fetch(`${API_BASE}/conversations/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
            content: payload.content,
            conversation_id: payload.conversationId ?? null,
        }),
    })

    if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: Failed to start stream`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // SSE messages are separated by \n\n
            const parts = buffer.split('\n\n')
            buffer = parts.pop() ?? '' // last incomplete chunk stays in buffer

            for (const part of parts) {
                if (!part.trim()) continue

                // Parse "event: <type>" and "data: <json>"
                let eventType = 'message'
                let dataLine = ''

                for (const line of part.split('\n')) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice('event: '.length).trim()
                    } else if (line.startsWith('data: ')) {
                        dataLine = line.slice('data: '.length).trim()
                    }
                }

                if (!dataLine) continue

                const parsed = JSON.parse(dataLine)

                switch (eventType) {
                    case 'metadata':
                        yield {
                            type: 'metadata',
                            conversationId: parsed.conversation_id as ID,
                            userMessageId: parsed.user_message_id as ID,
                        }
                        break
                    case 'token':
                        yield { type: 'token', token: parsed.token as string }
                        break
                    case 'done':
                        yield {
                            type: 'done',
                            assistantMessageId:
                                parsed.assistant_message_id as ID,
                            sources: parsed.sources ?? [],
                            agentType: parsed.agent_type as string,
                        }
                        break
                    case 'error':
                        yield {
                            type: 'error',
                            message: parsed.message as string,
                        }
                        break
                }
            }
        }
    } finally {
        reader.releaseLock()
    }
}
