import { useNavigate } from '@tanstack/react-router'
import { ArrowUp, BadgeQuestionMark, Mic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { PRIVATE_ROUTES } from '../../routes/paths'

const SUGGESTION_CHIPS = [
    {
        icon: BadgeQuestionMark,
        label: 'Hướng dẫn quy trình onboarding cho nhân viên mới',
    },
    {
        icon: BadgeQuestionMark,
        label: 'Tôi muốn xin nghỉ phép thì phải làm gì?',
    },
    {
        icon: BadgeQuestionMark,
        label: 'Chính sách bảo hiểm y tế của công ty như thế nào?',
    },
] as const

const InputBox = () => {
    const [inputValue, setInputValue] = useState('')
    const [isMultiLine, setIsMultiLine] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()

    const setActiveChat = useChatStore((s) => s.setActiveChat)
    const setInitialMessage = useChatStore((s) => s.setInitialMessage)

    const isStreaming = false

    // Auto-resize textarea & detect line count for multi-line layout
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        const scrollHeight = ta.scrollHeight
        ta.style.height = `${Math.min(scrollHeight, 180)}px`

        const hasLineBreak = inputValue.includes('\n')
        const isHeightMultiLine = scrollHeight > 36
        setIsMultiLine(hasLineBreak || isHeightMultiLine)
    }, [inputValue])

    const handleSubmit = async (text: string = inputValue) => {
        const content = text.trim()
        if (!content) return

        setInputValue('')

        // Lưu tin nhắn ban đầu vào store và reset activeChatId
        setInitialMessage(content)
        setActiveChat(null)

        // Chuyển hướng sang trang chat để thực hiện gửi tin nhắn và streaming
        navigate({ to: PRIVATE_ROUTES.CHAT })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSubmit()
        }
    }

    const hasInput = inputValue.trim().length > 0

    return (
        <div className="w-full max-w-3xl">
            {/* ── Input Box Container ───────────────────────────────── */}
            <div
                className={[
                    'bg-surface border transition-all duration-200',
                    isMultiLine
                        ? 'rounded-3xl p-4 shadow-md flex flex-col gap-2'
                        : 'rounded-full px-4 py-2.5 flex items-center gap-3 shadow-sm',
                    hasInput
                        ? 'border-border shadow-md'
                        : 'border-border-subtle focus-within:border-border focus-within:shadow-md',
                ].join(' ')}
            >
                {isMultiLine ? (
                    /* ── Multi-line Layout (Image 2 style) ─────────────── */
                    <>
                        <textarea
                            ref={textareaRef}
                            id="home-chat-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Hỏi bất kỳ điều gì..."
                            rows={2}
                            disabled={isStreaming}
                            className={[
                                'w-full resize-none bg-transparent',
                                'text-text-primary text-sm leading-relaxed',
                                'placeholder:text-text-placeholder',
                                'focus:outline-none disabled:opacity-50',
                                'px-1 pt-1 pb-1',
                            ].join(' ')}
                            style={{ minHeight: '52px', maxHeight: '180px' }}
                        />

                        {/* Bottom Toolbar: Mic & Send on right */}
                        <div className="flex items-center justify-end pt-2 border-t border-border-subtle/60 mt-1">
                            <button className="text-text-placeholder hover:text-text-primary p-2 mr-2">
                                <Mic className="w-4 h-4" />
                            </button>
                            <button
                                id="home-send-btn"
                                onClick={() => void handleSubmit()}
                                disabled={isStreaming || !hasInput}
                                aria-label="Gửi"
                                className={[
                                    'w-8 h-8 rounded-full bg-primary text-white',
                                    'flex items-center justify-center',
                                    'hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed',
                                    'transition-all duration-150 shadow-sm',
                                ].join(' ')}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    /* ── Single-line Layout ────────────────────────────── */
                    <>
                        <textarea
                            ref={textareaRef}
                            id="home-chat-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Hỏi bất kỳ điều gì..."
                            rows={1}
                            disabled={isStreaming}
                            className={[
                                'flex-1 resize-none bg-transparent',
                                'text-text-primary text-sm leading-relaxed',
                                'placeholder:text-text-placeholder',
                                'focus:outline-none disabled:opacity-50',
                                'py-1',
                            ].join(' ')}
                            style={{ minHeight: '24px', maxHeight: '180px' }}
                        />

                        <button className="text-text-placeholder hover:text-text-primary p-2">
                            <Mic className="w-4 h-4" />
                        </button>

                        <button
                            id="home-send-btn"
                            onClick={() => void handleSubmit()}
                            disabled={isStreaming || !hasInput}
                            aria-label="Gửi"
                            className={[
                                'w-8 h-8 rounded-full bg-primary text-white',
                                'flex items-center justify-center',
                                'hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed',
                                'transition-all duration-150 shadow-sm',
                            ].join(' ')}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </>
                )}
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
    )
}

export default InputBox
