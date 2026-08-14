import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import type { SelectSize } from '../../types/common'

export interface SelectOption {
    value: string | number | null
    label: string
}

interface SearchableSelectProps {
    options: SelectOption[]
    value: string | number | null | undefined
    onChange: (value: any) => void
    placeholder?: string
    label?: string
    disabled?: boolean
    className?: string
    size?: SelectSize
    required?: boolean
}

const paddingMap: Record<SelectSize, string> = {
    sm: 'py-2',
    md: 'py-2.5',
    lg: 'py-3.5',
}

const fontSizeMap: Record<SelectSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
}

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Chọn tùy chọn...',
    label,
    disabled = false,
    className = '',
    size = 'md',
    required = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const paddingSelect = paddingMap[size]
    const fontSizeSelect = fontSizeMap[size]

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (val: string | number | null) => {
        onChange(val)
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (disabled) return
        onChange(null)
    }

    const handleToggleOpen = () => {
        if (isOpen) {
            setSearchQuery('')
        }
        setIsOpen(!isOpen)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={handleToggleOpen}
                className={[
                    'w-full flex items-center justify-between gap-2 bg-surface-raised border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-text-primary text-left transition-all outline-none',
                    paddingSelect,
                    isOpen
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-text-placeholder',
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                ].join(' ')}
            >
                <span
                    className={[
                        fontSizeSelect,
                        selectedOption
                            ? 'text-text-primary'
                            : 'text-text-placeholder font-normal',
                    ].join(' ')}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <div className="flex items-center gap-1">
                    {selectedOption && value !== null && value !== '' && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 hover:bg-bg/25 rounded-full text-text-placeholder hover:text-text-secondary transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={[
                            'w-3.5 h-3.5 text-text-placeholder transition-transform duration-200',
                            isOpen ? 'transform rotate-180 text-primary' : '',
                        ].join(' ')}
                    />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-border shadow-lg rounded-xl overflow-hidden animate-fade-in flex flex-col max-h-60">
                    <div className="p-2 border-b border-border bg-bg/10 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-text-placeholder" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-placeholder"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="p-0.5 text-text-placeholder hover:text-text-secondary"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 py-1 max-h-48 divide-y divide-[#D4D7DE]/20">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-text-placeholder text-center">
                                Không tìm thấy kết quả
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = option.value === value
                                return (
                                    <button
                                        key={String(option.value)}
                                        type="button"
                                        onClick={() =>
                                            handleSelect(option.value)
                                        }
                                        className={[
                                            'w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors',
                                            isSelected
                                                ? 'bg-primary/5 text-primary font-bold'
                                                : 'text-text-secondary hover:bg-bg/25 hover:text-text-primary',
                                        ].join(' ')}
                                    >
                                        <span className="truncate">
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
