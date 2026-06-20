import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteConversation } from '../api/chat'
import { CONVERSATIONS_QUERY_KEY } from './useConversations'
import { useChatStore } from '../store/chatStore'
import type { ID } from '../types/common'

/**
 * useDeleteConversation — Mutation để xoá conversation.
 *
 * Sau khi xoá thành công:
 * 1. Invalidate cache conversations → sidebar tự cập nhật.
 * 2. Nếu conversation bị xoá đang là active → clear Zustand state.
 */
export function useDeleteConversation() {
    const queryClient = useQueryClient()
    const { activeChatId, clearActiveChat } = useChatStore()

    return useMutation<void, Error, ID>({
        mutationFn: deleteConversation,
        onSuccess: (_data, deletedId) => {
            // Refresh sidebar list
            queryClient.invalidateQueries({
                queryKey: CONVERSATIONS_QUERY_KEY,
            })
            // Nếu đang xem conversation bị xoá → bỏ chọn
            if (activeChatId === deletedId) {
                clearActiveChat()
            }
        },
    })
}
