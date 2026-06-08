import { useEffect, useRef } from 'react'
import { Bot, User, Loader2, MessageSquare } from 'lucide-react'
import type { Message } from '../../types/chat'

/* ============================================================
   Props
   ============================================================ */

interface MessageListProps {
    /** Danh sách messages đã được load */
    messages: Message[]
    /** Đang load lần đầu */
    isLoading: boolean
    /** Đang load thêm messages cũ hơn */
    isFetchingMore: boolean
    /** Còn messages cũ hơn chưa load */
    hasMore: boolean
    /** Callback khi cần load thêm messages */
    onLoadMore: () => void
    /** Đang gửi / stream câu trả lời */
    isSending: boolean
    /** Nội dung đang stream từ AI (token-by-token) */
    streamingContent: string
}

/* ============================================================
   Empty state
   ============================================================ */

function EmptyState() {
    return (
        <div className="empty-state">
            <div className="empty-state__icon">
                <MessageSquare size={28} />
            </div>
            <div className="empty-state__text">
                <h2 className="empty-state__title">Bắt đầu cuộc trò chuyện</h2>
                <p className="empty-state__desc">
                    Đặt câu hỏi về chính sách nhân sự, quy trình, hoặc bất kỳ
                    điều gì bạn cần.
                </p>
            </div>
        </div>
    )
}

/* ============================================================
   Message bubble
   ============================================================ */

interface BubbleProps {
    msg: Message
}

function MessageBubble({ msg }: BubbleProps) {
    const isUser = msg.actor === 'user'

    return (
        <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--bot'}`}>
            {/* Avatar */}
            <div
                className={`msg-avatar ${isUser ? 'msg-avatar--user' : 'msg-avatar--bot'}`}
            >
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div
                className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--bot'}`}
            >
                <p className="msg-bubble__content">{msg.content}</p>
                <p
                    className={`msg-bubble__time ${isUser ? 'msg-bubble__time--user' : ''}`}
                >
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
    )
}

/* ============================================================
   Streaming bubble (bot đang trả lời)
   ============================================================ */

interface StreamBubbleProps {
    content: string
}

function StreamBubble({ content }: StreamBubbleProps) {
    return (
        <div className="msg-row msg-row--bot">
            <div className="msg-avatar msg-avatar--bot">
                <Bot size={16} />
            </div>
            <div className="msg-bubble msg-bubble--bot">
                {content ? (
                    <p className="msg-bubble__content">{content}</p>
                ) : (
                    /* Typing indicator khi chưa có token nào */
                    <div className="typing-indicator">
                        <span className="typing-dot typing-dot--1" />
                        <span className="typing-dot typing-dot--2" />
                        <span className="typing-dot typing-dot--3" />
                    </div>
                )}
            </div>
        </div>
    )
}

/* ============================================================
   Main component
   ============================================================ */

export default function MessageList({
    messages,
    isLoading,
    isFetchingMore,
    hasMore,
    onLoadMore,
    isSending,
    streamingContent,
}: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const topSentinelRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    // Lưu scrollHeight trước khi prepend để khôi phục vị trí scroll
    const prevScrollHeightRef = useRef<number>(0)

    // ── Auto scroll xuống khi có message mới ─────────────────────────
    useEffect(() => {
        if (messages.length > 0 || streamingContent) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages.length, streamingContent])

    // ── Khôi phục scroll position sau khi prepend messages cũ ────────
    useEffect(() => {
        if (!isFetchingMore && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight
            const diff = newScrollHeight - prevScrollHeightRef.current
            if (diff > 0) {
                containerRef.current.scrollTop = diff
            }
        }
    }, [isFetchingMore, messages])

    // ── IntersectionObserver trên sentinel đầu danh sách ─────────────
    useEffect(() => {
        const sentinel = topSentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isFetchingMore) {
                    // Lưu scrollHeight trước khi load
                    if (containerRef.current) {
                        prevScrollHeightRef.current =
                            containerRef.current.scrollHeight
                    }
                    onLoadMore()
                }
            },
            {
                root: containerRef.current,
                threshold: 0.1,
            }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, isFetchingMore, onLoadMore])

    // ── Loading state ─────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="msg-list-center">
                <Loader2 className="spin-icon" size={24} />
            </div>
        )
    }

    // ── Empty state ───────────────────────────────────────────────────
    if (messages.length === 0 && !isSending) {
        return <EmptyState />
    }

    // ── Message list ──────────────────────────────────────────────────
    return (
        <div className="msg-list" ref={containerRef}>
            {/* Sentinel: khi xuất hiện trong viewport → load thêm */}
            <div ref={topSentinelRef} className="msg-list__sentinel" />

            {/* Load more spinner */}
            {isFetchingMore && (
                <div className="msg-list__load-more">
                    <Loader2 className="spin-icon spin-icon--sm" size={16} />
                    <span className="msg-list__load-more-text">
                        Đang tải thêm...
                    </span>
                </div>
            )}

            {/* Messages */}
            <div className="msg-list__inner">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                ))}

                {/* Bot đang trả lời */}
                {isSending && <StreamBubble content={streamingContent} />}
            </div>

            {/* Scroll anchor */}
            <div ref={bottomRef} />
        </div>
    )
}
