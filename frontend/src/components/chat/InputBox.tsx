import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Loader2, Mic, MicOff } from 'lucide-react'
import { toast } from 'sonner'
import {
    useSpeechRecognition,
    startListening,
    stopListening,
    checkSpeechRecognitionSupport,
} from '../../lib/speechRecognition'

/* ============================================================
   Props
   ============================================================ */

interface InputBoxProps {
    /** Callback khi người dùng gửi tin nhắn */
    onSend: (content: string) => void
    /** Đang gửi / stream */
    isSending: boolean
    /** Vô hiệu hoá input (chưa chọn conversation, v.v.) */
    disabled?: boolean
}

/* ============================================================
   Component
   ============================================================ */

export default function InputBox({
    onSend,
    isSending,
    disabled = false,
}: InputBoxProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const baseTextRef = useRef('')

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    } = useSpeechRecognition()

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`
    }, [])

    // Đồng bộ transcript nhận dạng giọng nói vào textarea
    useEffect(() => {
        if (listening) {
            const base = baseTextRef.current
            const combined = base
                ? `${base}${base.endsWith(' ') || !transcript ? '' : ' '}${transcript}`
                : transcript
            setValue(combined)
            resizeTextarea()
        }
    }, [transcript, listening, resizeTextarea])

    // Khi ngưng nhận diện giọng nói, reset lại transcript tạm thời
    const prevListeningRef = useRef(listening)
    useEffect(() => {
        if (prevListeningRef.current && !listening) {
            resetTranscript()
            baseTextRef.current = ''
        }
        prevListeningRef.current = listening
    }, [listening, resetTranscript])

    const handleSend = useCallback(() => {
        const content = value.trim()
        if (!content || isSending || disabled) return

        if (listening) {
            stopListening()
            resetTranscript()
            baseTextRef.current = ''
        }

        onSend(content)
        setValue('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [value, isSending, disabled, onSend, listening, resetTranscript])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
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
            baseTextRef.current = value
            resetTranscript()
            startListening({ language: 'vi-VN', continuous: true })
            toast.info('Đang lắng nghe... Hãy nói câu hỏi của bạn', { duration: 3000 })
        }
    }

    const isBlocked = isSending || disabled

    return (
        <div className="input-box">
            {listening && (
                <div className="input-box__listening-badge animate-fade-in-down">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span>Đang lắng nghe giọng nói... Bấm nút micro để dừng hoặc Enter để gửi.</span>
                </div>
            )}
            <div className="input-box__row">
                <textarea
                    id="chat-input"
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        if (listening) {
                            baseTextRef.current = e.target.value
                            resetTranscript()
                        }
                        resizeTextarea()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        listening
                            ? 'Đang nhận diện giọng nói của bạn...'
                            : 'Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter để xuống dòng)'
                    }
                    rows={1}
                    disabled={isBlocked}
                    className="input-box__textarea"
                />
                <button
                    id="chat-mic-btn"
                    type="button"
                    onClick={toggleListening}
                    disabled={isBlocked}
                    className={`input-box__mic-btn ${
                        listening ? 'input-box__mic-btn--listening' : ''
                    }`}
                    title={
                        listening
                            ? 'Đang nhận diện... Bấm để dừng'
                            : 'Nhập bằng giọng nói (Tiếng Việt)'
                    }
                    aria-label={
                        listening ? 'Dừng nhận diện giọng nói' : 'Nhập bằng giọng nói'
                    }
                >
                    {listening ? (
                        <MicOff className="w-5 h-5" />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>
                <button
                    id="chat-send-btn"
                    onClick={handleSend}
                    disabled={!value.trim() || isBlocked}
                    className="input-box__send-btn"
                    aria-label="Gửi tin nhắn"
                >
                    {isSending ? (
                        <Loader2 size={18} className="spin-icon" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
            <p className="input-box__hint">
                SEVAP có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
            </p>
        </div>
    )
}
