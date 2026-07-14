import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchConversations } from '../api/chat'
import { useChatStore } from '../store/chatStore'
import type { ConversationPaginatedResponse } from '../types/chat'

export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const

/**
 * useConversations — Fetch và cache danh sách conversations từ server với infinite scroll.
 *
 * - Server state được quản lý bởi TanStack Query (cache, refetch, loading).
 * - `searchKeyword` lấy từ Zustand để filter phía client (không gọi thêm API).
 */
export function useConversations() {
    const keywordSearch = useChatStore((s) => s.searchKeyword)
    const limit = useChatStore((s) => s.limit)

    const queryKey = [
        ...CONVERSATIONS_QUERY_KEY,
        {
            keywordSearch,
            limit,
        },
    ] as const

    const query = useInfiniteQuery<ConversationPaginatedResponse>({
        queryKey,
        queryFn: ({ pageParam = 1 }) =>
            fetchConversations({
                query: keywordSearch,
                page: pageParam as number,
                limit,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pagination = lastPage.pagination
            if (!pagination) return undefined
            const { page, total_pages } = pagination
            return page < total_pages ? page + 1 : undefined
        },
    })

    // Lấy tất cả conversations từ tất cả các trang đã load
    const conversations = query.data?.pages.flatMap((page) => page.conversations) ?? []

    // Sắp xếp theo thứ tự mới nhất trước, dựa trên updatedAt hoặc createdAt
    const sortedConversations = [...conversations].sort(
        (a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime()
            const timeB = new Date(b.updatedAt || b.createdAt).getTime()
            return timeB - timeA
        }
    )

    // Lấy thông tin pagination của trang cuối cùng
    const lastPagePagination = query.data?.pages[query.data.pages.length - 1]?.pagination

    return {
        ...query,
        conversations: sortedConversations,
        pagination: lastPagePagination,
    }
}
