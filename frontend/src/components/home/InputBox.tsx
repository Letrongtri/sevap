import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, FileText, Mic, PenLine, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useSendMessage } from '../../hooks/useSendMessage'
import { PRIVATE_ROUTES } from '../../routes/paths'

const SUGGESTION_CHIPS = [
    {
        icon: FileText,
        label: 'Chính sách bảo hiểm y tế của công ty như thế nào?',
    },
    { icon: ClipboardList, label: 'Tạo đơn xin nghỉ phép cho tôi' },
    { icon: PenLine, label: 'Tra cứu ngày phép hiện tại của tôi' },
] as const

const InputBox = () => {
    const [inputValue, setInputValue] = useState('')
    const [isListening, setIsListening] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()

    const setActiveChat = useChatStore((s) => s.setActiveChat)

    const { sendMessage, streamingState } = useSendMessage()
    const isStreaming = streamingState.isStreaming

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
    }, [inputValue])

    const handleSubmit = async (text: string = inputValue) => {
        const content = text.trim()
        if (!content || isStreaming) return

        setInputValue('')

        // Start streaming — single endpoint creates conv if needed
        const convIdPromise = sendMessage(content)

        // Navigate immediately — the streaming hook will update activeChatId
        // once the metadata event arrives via the invalidateQueries + store updates
        navigate({ to: PRIVATE_ROUTES.CHAT })

        // When we get back the resolved conversation ID, set it as active
        const resolvedId = await convIdPromise
        if (resolvedId) setActiveChat(resolvedId)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSubmit()
        }
    }

    const hasInput = inputValue.trim().length > 0
    return (
        <>
            <div className="w-full max-w-2xl">
                <div
                    className={[
                        'flex items-end gap-3 px-4 py-3',
                        'bg-surface rounded-full border',
                        'shadow-sm transition-all duration-200',
                        hasInput
                            ? 'border-border shadow-md'
                            : 'border-border-subtle',
                    ].join(' ')}
                >
                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        id="home-chat-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Hỏi bất kỳ điều gì"
                        rows={1}
                        disabled={isStreaming}
                        className={[
                            'flex-1 resize-none bg-transparent',
                            'text-text-primary text-sm leading-relaxed',
                            'placeholder:text-text-placeholder',
                            'focus:outline-none disabled:opacity-50',
                        ].join(' ')}
                        style={{ minHeight: '24px', maxHeight: '180px' }}
                    />

                    {/* Right actions */}
                    <div className="flex-shrink-0 flex items-center gap-2 mb-0.5">
                        {hasInput ? (
                            /* Send button when typing */
                            <button
                                id="home-send-btn"
                                onClick={() => void handleSubmit()}
                                disabled={isStreaming}
                                aria-label="Gửi"
                                className={[
                                    'w-8 h-8 rounded-full bg-primary text-white',
                                    'flex items-center justify-center',
                                    'hover:bg-primary/80 disabled:opacity-50',
                                    'transition-all duration-150',
                                ].join(' ')}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                aria-label="Nhập bằng giọng nói"
                                onClick={() => setIsListening((v) => !v)}
                                className={[
                                    'w-7 h-7 flex items-center justify-center rounded-full',
                                    'transition-all duration-150',
                                    isListening
                                        ? 'text-primary'
                                        : 'text-text-secondary hover:text-primary',
                                ].join(' ')}
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Suggestion chips ─────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    {SUGGESTION_CHIPS.map(({ icon: Icon, label }) => (
                        <button
                            key={label}
                            onClick={() => {
                                setInputValue(label)
                                textareaRef.current?.focus()
                            }}
                            className={[
                                'flex items-center gap-1.5 px-4 py-2 rounded-full border',
                                'border-border-subtle bg-surface text-sm text-text-primary',
                                'hover:border-border hover:bg-surface-raised',
                                'hover:text-text-primary',
                                'transition-all duration-150',
                            ].join(' ')}
                        >
                            <Icon className="w-3.5 h-3.5 text-text-secondary" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}

export default InputBox
