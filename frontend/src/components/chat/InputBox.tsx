import { useState, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'

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

export default function InputBox({ onSend, isSending, disabled = false }: InputBoxProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`
    }, [])

    const handleSend = useCallback(() => {
        const content = value.trim()
        if (!content || isSending || disabled) return
        onSend(content)
        setValue('')
        // Reset chiều cao
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [value, isSending, disabled, onSend])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const isBlocked = isSending || disabled

    return (
        <div className="input-box">
            <div className="input-box__row">
                <textarea
                    id="chat-input"
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        resizeTextarea()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                    rows={1}
                    disabled={isBlocked}
                    className="input-box__textarea"
                />
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
