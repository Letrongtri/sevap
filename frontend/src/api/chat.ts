import axiosClient from './axios'
import type {
    Conversation,
    Message,
    SendMessagePayload,
    CreateConversationPayload,
} from '../types/chat'

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

/** Gửi một tin nhắn vào conversation */
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
