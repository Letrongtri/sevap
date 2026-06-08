import { useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useChatStore } from '../store/chatStore'
import { useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import MessageList from '../components/chat/MessageList'
import InputBox from '../components/chat/InputBox'
import type { Message } from '../types/chat'

/* ─────────────────────────────────────────────────────────────
   ChatPage — hỗ trợ cả /chat và /chat/:conversationId
   ───────────────────────────────────────────────────────────── */

export default function ChatPage() {
    const navigate = useNavigate()

    // ── URL param (có thể undefined khi ở /chat) ──────────────────────
    const { conversationId: conversationIdParam } =
        useParams({ strict: false }) as { conversationId?: string }

    const urlConversationId = conversationIdParam
        ? parseInt(conversationIdParam, 10)
        : null

    // ── Client state (Zustand) ─────────────────────────────────────────
    const { activeChatId, setActiveChat } = useChatStore()

    // Đồng bộ URL → Zustand khi trang load lần đầu hoặc URL thay đổi
    useEffect(() => {
        if (urlConversationId !== null && urlConversationId !== activeChatId) {
            setActiveChat(urlConversationId)
        }
        if (urlConversationId === null && activeChatId !== null) {
            // /chat không có id → bỏ chọn
            setActiveChat(null)
        }
    }, [urlConversationId]) // eslint-disable-line react-hooks/exhaustive-deps

    const conversationId = urlConversationId ?? activeChatId

    // ── Messages với infinite scroll ──────────────────────────────────
    const {
        messages,
        isLoading,
        isFetchingMore,
        hasMore,
        isError,
        fetchMore,
        appendOptimistic,
        invalidate,
    } = useMessages(conversationId)

    // ── Streaming ─────────────────────────────────────────────────────
    const { sendMessage, streamingState } = useSendMessage()
    const { isStreaming, streamingContent, streamingConversationId } = streamingState

    // Theo dõi xem stream vừa kết thúc chưa
    const prevIsStreamingRef = useRef(false)

    useEffect(() => {
        const wasStreaming = prevIsStreamingRef.current
        prevIsStreamingRef.current = isStreaming

        if (wasStreaming && !isStreaming) {
            // Stream vừa hoàn tất → fetch lại messages thật từ server
            invalidate()

            // Nếu đây là conversation mới (chưa có trên URL) → điều hướng
            if (
                streamingConversationId &&
                streamingConversationId !== conversationId
            ) {
                navigate({
                    to: '/chat/$conversationId',
                    params: { conversationId: String(streamingConversationId) },
                })
            }
        }
    }, [isStreaming]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Gửi tin nhắn ──────────────────────────────────────────────────
    const handleSend = useCallback(
        (content: string) => {
            // 1. Hiển thị ngay bubble của user (optimistic)
            const optimisticMsg: Message = {
                id: -Date.now(), // id âm để phân biệt
                conversationId: conversationId ?? -1,
                actor: 'user',
                content,
                createdAt: new Date().toISOString(),
            }
            appendOptimistic(optimisticMsg)

            // 2. Bắt đầu stream (agent sẽ trả lời)
            sendMessage(content, conversationId)
        },
        [sendMessage, conversationId, appendOptimistic]
    )

    return (
        <div className="chat-page">
            <div className="chat-container">
                {/* Messages area */}
                <div className="chat-container__messages">
                    {isError ? (
                        <div className="msg-list-center">
                            <p className="error-text">
                                Không thể tải tin nhắn. Vui lòng thử lại.
                            </p>
                        </div>
                    ) : (
                        <MessageList
                            messages={messages}
                            isLoading={isLoading}
                            isFetchingMore={isFetchingMore}
                            hasMore={hasMore}
                            onLoadMore={fetchMore}
                            isSending={isStreaming}
                            streamingContent={streamingContent}
                        />
                    )}
                </div>

                {/* Input area */}
                <div className="chat-container__input">
                    <InputBox
                        onSend={handleSend}
                        isSending={isStreaming}
                        disabled={false}
                    />
                </div>
            </div>
        </div>
    )
}
