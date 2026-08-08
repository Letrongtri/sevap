import { useNavigate } from '@tanstack/react-router'
import { ArrowUp, BadgeQuestionMark, Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useChatStore } from '../../store/chatStore'
import { PRIVATE_ROUTES } from '../../routes/paths'
import {
    useSpeechRecognition,
    startListening,
    stopListening,
    checkSpeechRecognitionSupport,
} from '../../lib/speechRecognition'

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
    const baseTextRef = useRef('')
    const navigate = useNavigate()

    const setActiveChat = useChatStore((s) => s.setActiveChat)
    const setInitialMessage = useChatStore((s) => s.setInitialMessage)

    const isStreaming = false

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    } = useSpeechRecognition()

    // Đồng bộ transcript nhận dạng giọng nói vào inputValue
    useEffect(() => {
        if (listening) {
            const base = baseTextRef.current
            const combined = base
                ? `${base}${base.endsWith(' ') || !transcript ? '' : ' '}${transcript}`
                : transcript
            setInputValue(combined)
        }
    }, [transcript, listening])

    // Khi dừng thu âm, reset transcript tạm thời
    const prevListeningRef = useRef(listening)
    useEffect(() => {
        if (prevListeningRef.current && !listening) {
            resetTranscript()
            baseTextRef.current = ''
        }
        prevListeningRef.current = listening
    }, [listening, resetTranscript])

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

        if (listening) {
            stopListening()
            resetTranscript()
            baseTextRef.current = ''
        }

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

    const toggleListening = () => {
        if (!checkSpeechRecognitionSupport() || !browserSupportsSpeechRecognition) {
            toast.error(
                'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng sử dụng Google Chrome hoặc Microsoft Edge.'
            )
            return
        }

        if (isMicrophoneAvailable === false) {
            toast.error(
                'Không thể truy cập Micro. Vui lòng kiểm tra và cấp quyền micro cho trình duyệt.'
            )
            return
        }

        if (listening) {
            stopListening()
            toast.info('Đã dừng nhận diện giọng nói')
        } else {
            baseTextRef.current = inputValue
            resetTranscript()
            startListening({ language: 'vi-VN', continuous: true })
            toast.info('Đang lắng nghe... Hãy nói câu hỏi của bạn', { duration: 3000 })
        }
    }

    const hasInput = inputValue.trim().length > 0

    return (
        <div className="w-full max-w-3xl">
            {listening && (
                <div className="flex items-center gap-2 px-3.5 py-2 mb-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium animate-fade-in-down">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span>Đang lắng nghe giọng nói... Bấm nút micro để dừng hoặc Enter để gửi.</span>
                </div>
            )}

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
                    /* ── Multi-line Layout ─────────────────────────────── */
                    <>
                        <textarea
                            ref={textareaRef}
                            id="home-chat-input"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value)
                                if (listening) {
                                    baseTextRef.current = e.target.value
                                    resetTranscript()
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                listening
                                    ? 'Đang nhận diện giọng nói của bạn...'
                                    : 'Hỏi bất kỳ điều gì...'
                            }
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
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle/60 mt-1">
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={isStreaming}
                                className={[
                                    'p-2 rounded-full transition-all duration-150 flex items-center justify-center',
                                    listening
                                        ? 'bg-red-500 text-white animate-pulse shadow-md hover:bg-red-600'
                                        : 'text-text-placeholder hover:text-text-primary hover:bg-surface-raised',
                                ].join(' ')}
                                title={
                                    listening
                                        ? 'Đang nhận diện... Bấm để dừng'
                                        : 'Nhập bằng giọng nói (Tiếng Việt)'
                                }
                                aria-label={
                                    listening
                                        ? 'Dừng nhận diện giọng nói'
                                        : 'Nhập bằng giọng nói'
                                }
                            >
                                {listening ? (
                                    <MicOff className="w-4 h-4" />
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
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
                            onChange={(e) => {
                                setInputValue(e.target.value)
                                if (listening) {
                                    baseTextRef.current = e.target.value
                                    resetTranscript()
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                listening
                                    ? 'Đang nhận diện giọng nói của bạn...'
                                    : 'Hỏi bất kỳ điều gì...'
                            }
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

                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isStreaming}
                            className={[
                                'p-2 rounded-full transition-all duration-150 flex items-center justify-center',
                                listening
                                    ? 'bg-red-500 text-white animate-pulse shadow-md hover:bg-red-600'
                                    : 'text-text-placeholder hover:text-text-primary hover:bg-surface-raised',
                            ].join(' ')}
                            title={
                                listening
                                    ? 'Đang nhận diện... Bấm để dừng'
                                    : 'Nhập bằng giọng nói (Tiếng Việt)'
                            }
                            aria-label={
                                listening
                                    ? 'Dừng nhận diện giọng nói'
                                    : 'Nhập bằng giọng nói'
                            }
                        >
                            {listening ? (
                                <MicOff className="w-4 h-4" />
                            ) : (
                                <Mic className="w-4 h-4" />
                            )}
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
