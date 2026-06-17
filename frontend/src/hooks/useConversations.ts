import { useQuery } from '@tanstack/react-query'
import { fetchConversations } from '../api/chat'
import { useChatStore } from '../store/chatStore'
import type { Conversation } from '../types/chat'

export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const

/**
 * useConversations — Fetch và cache danh sách conversations từ server.
 *
 * - Server state được quản lý bởi TanStack Query (cache, refetch, loading).
 * - `searchKeyword` lấy từ Zustand để filter phía client (không gọi thêm API).
 */
export function useConversations() {
    const searchKeyword = useChatStore((s) => s.searchKeyword)

    const query = useQuery<Conversation[]>({
        queryKey: CONVERSATIONS_QUERY_KEY,
        queryFn: fetchConversations,
    })

    // Sắp xếp theo thứ tự mới nhất trước, dựa trên updatedAt hoặc createdAt
    const sortedConversations = [...(query.data ?? [])].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime()
        const timeB = new Date(b.updatedAt || b.createdAt).getTime()
        return timeB - timeA
    })

    // Filter phía client theo keyword (không cần gọi API lại)
    const filteredConversations = searchKeyword
        ? sortedConversations.filter((c) =>
              c.title.toLowerCase().includes(searchKeyword.toLowerCase())
          )
        : sortedConversations

    return {
        ...query,
        conversations: filteredConversations,
    }
}
