import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { streamMessage } from '../api/chat'
import { CONVERSATIONS_QUERY_KEY } from './useConversations'
import { messagesQueryKey } from './useMessages'
import type { StreamingState } from '../types/chat'

/**
 * useSendMessage — Hook để gửi tin nhắn và nhận câu trả lời dạng stream.
 *
 * Trả về:
 *   - sendMessage(content, conversationId?) — bắt đầu stream
 *   - abort() — huỷ stream đang chạy
 *   - streamingState — { isStreaming, streamingConversationId, streamingContent }
 *   - error — lỗi nếu có
 */
export function useSendMessage() {
    const queryClient = useQueryClient()
    const abortRef = useRef<AbortController | null>(null)

    const [error, setError] = useState<Error | null>(null)
    const [streamingState, setStreamingState] = useState<StreamingState>({
        isStreaming: false,
        streamingConversationId: null,
        streamingContent: '',
    })

    const abort = useCallback(() => {
        abortRef.current?.abort()
    }, [])

    const sendMessage = useCallback(
        async (content: string, conversationId?: number | null) => {
            // Cancel any previous in-flight stream
            abortRef.current?.abort()
            abortRef.current = new AbortController()

            setError(null)
            setStreamingState({
                isStreaming: true,
                streamingConversationId: conversationId ?? null,
                streamingContent: '',
            })

            let resolvedConversationId: number | null = conversationId ?? null

            try {
                const gen = streamMessage({ content, conversationId })

                for await (const event of gen) {
                    // Check if aborted between yields
                    if (abortRef.current?.signal.aborted) break

                    switch (event.type) {
                        case 'metadata':
                            resolvedConversationId = event.conversationId
                            setStreamingState((prev) => ({
                                ...prev,
                                streamingConversationId: event.conversationId,
                            }))
                            // Optimistically invalidate conversation list so
                            // the new conv appears in the sidebar immediately
                            queryClient.invalidateQueries({
                                queryKey: CONVERSATIONS_QUERY_KEY,
                            })
                            break

                        case 'token':
                            setStreamingState((prev) => ({
                                ...prev,
                                streamingContent: prev.streamingContent + event.token,
                            }))
                            break

                        case 'done':
                            // Refresh messages list for the finished conversation
                            if (resolvedConversationId) {
                                queryClient.invalidateQueries({
                                    queryKey: messagesQueryKey(resolvedConversationId),
                                })
                            }
                            break

                        case 'error':
                            setError(new Error(event.message))
                            break
                    }
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Intentional abort — not an error
                } else {
                    setError(err instanceof Error ? err : new Error('Unknown streaming error'))
                }
            } finally {
                setStreamingState((prev) => ({
                    ...prev,
                    isStreaming: false,
                }))
            }

            return resolvedConversationId
        },
        [queryClient]
    )

    return { sendMessage, abort, streamingState, error }
}
