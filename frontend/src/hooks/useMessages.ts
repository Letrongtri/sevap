import { useQuery } from '@tanstack/react-query'
import { fetchMessages } from '../api/chat'
import type { Message } from '../types/chat'

export const messagesQueryKey = (conversationId: number | null) =>
    ['messages', conversationId] as const

/**
 * useMessages — Fetch và cache messages của một conversation.
 *
 * Chỉ gọi API khi `conversationId` khác null (enabled guard).
 */
export function useMessages(conversationId: number | null) {
    return useQuery<Message[]>({
        queryKey: messagesQueryKey(conversationId),
        queryFn: () => fetchMessages(conversationId!),
        // Không fetch nếu chưa chọn conversation
        enabled: conversationId !== null,
        // Messages ít thay đổi đột ngột, giữ cache 10 giây
        staleTime: 10 * 1000,
    })
}
