import React, { useRef } from 'react'
import { Calendar, X } from 'lucide-react'
import type { SelectSize } from '../../types/common'

interface DatePickerProps {
    value: string | null | undefined
    onChange: (value: string | null) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    size?: SelectSize
}

const sizeMap: Record<SelectSize, string> = {
    sm: 'py-2 text-xs',
    md: 'py-2.5 text-sm',
    lg: 'py-3.5 text-base',
}

export default function DatePicker({
    value,
    onChange,
    placeholder = 'Chọn ngày...',
    disabled = false,
    className = '',
    size = 'md',
}: DatePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const sizeStyle = sizeMap[size]

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }

    const handleButtonClick = () => {
        if (inputRef.current) {
            try {
                // Modern browsers support showPicker() on input elements
                inputRef.current.showPicker()
            } catch {
                // Fallback for older browsers
                inputRef.current.click()
            }
        }
    }

    const formatDateDisplay = (val: string) => {
        if (!val) return ''
        const date = new Date(val)
        if (isNaN(date.getTime())) return val
        return date.toLocaleDateString('vi-VN')
    }

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={handleButtonClick}
                className={[
                    'w-full flex items-center justify-between gap-2 bg-surface-raised border border-border px-3 rounded-xl text-text-primary text-left transition-all outline-none',
                    sizeStyle,
                    'hover:border-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20',
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                ].join(' ')}
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-placeholder" />
                    <span
                        className={
                            value
                                ? 'text-text-primary'
                                : 'text-text-placeholder font-medium'
                        }
                    >
                        {value ? formatDateDisplay(value) : placeholder}
                    </span>
                </div>

                {value && (
                    <span
                        onClick={handleClear}
                        className="p-0.5 hover:bg-bg/25 rounded-full text-text-placeholder hover:text-text-secondary transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </span>
                )}
            </button>
            <input
                ref={inputRef}
                type="date"
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
            />
        </div>
    )
}
