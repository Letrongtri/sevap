import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateConversation } from '../api/chat'
import { CONVERSATIONS_QUERY_KEY } from './useConversations'
import type { ID } from '../types/common'
import type { Conversation } from '../types/chat'

/**
 * useUpdateConversation — Mutation để đổi tên (rename) conversation.
 *
 * Sau khi đổi tên thành công:
 * Invalidate cache conversations → sidebar tự cập nhật tiêu đề mới.
 */
export function useUpdateConversation() {
    const queryClient = useQueryClient()

    return useMutation<
        Conversation,
        Error,
        { id: ID; title: string }
    >({
        mutationFn: ({ id, title }) => updateConversation(id, title),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CONVERSATIONS_QUERY_KEY,
            })
        },
    })
}
