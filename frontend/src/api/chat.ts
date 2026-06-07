import axiosClient from './axios'
import { useAuthStore } from '../store/authStore'
import type {
    Conversation,
    Message,
    SendMessagePayload,
    CreateConversationPayload,
    StreamEvent,
} from '../types/chat'

const API_BASE = 'http://localhost:8000/api/v1'

/* ============================================================
   Conversations
   ============================================================ */

/** Lấy danh sách tất cả conversations của user hiện tại */
export const fetchConversations = async (): Promise<Conversation[]> => {
    const res = await axiosClient.get('/conversations')
    return res.data
}

/** Lấy chi tiết một conversation */
export const fetchConversationById = async (
    id: number
): Promise<Conversation> => {
    const res = await axiosClient.get(`/conversations/${id}`)
    return res.data
}

/** Tạo conversation mới */
export const createConversation = async (
    payload: CreateConversationPayload
): Promise<Conversation> => {
    const res = await axiosClient.post('/conversations', payload)
    return res.data
}

/** Xoá một conversation */
export const deleteConversation = async (id: number): Promise<void> => {
    await axiosClient.delete(`/conversations/${id}`)
}

/* ============================================================
   Messages
   ============================================================ */

/** Lấy danh sách messages của một conversation */
export const fetchMessages = async (
    conversationId: number
): Promise<Message[]> => {
    const res = await axiosClient.get(
        `/conversations/${conversationId}/messages`
    )
    return res.data
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
    return res.data
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
    conversationId?: number | null
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
                            conversationId: parsed.conversation_id as number,
                            userMessageId: parsed.user_message_id as number,
                        }
                        break
                    case 'token':
                        yield { type: 'token', token: parsed.token as string }
                        break
                    case 'done':
                        yield {
                            type: 'done',
                            assistantMessageId: parsed.assistant_message_id as number,
                            sources: parsed.sources ?? [],
                            agentType: parsed.agent_type as string,
                        }
                        break
                    case 'error':
                        yield { type: 'error', message: parsed.message as string }
                        break
                }
            }
        }
    } finally {
        reader.releaseLock()
    }
}
