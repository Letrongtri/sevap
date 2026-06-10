/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

export interface SelectOption {
    value: string | number
    label: string
}

interface SearchableMultiSelectProps {
    options: SelectOption[]
    value: (string | number)[]
    onChange: (value: any[]) => void
    placeholder?: string
    label?: string
    disabled?: boolean
    className?: string
}

export default function SearchableMultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = 'Select options...',
    label,
    disabled = false,
    className = '',
}: SearchableMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

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

    const selectedOptions = options.filter((opt) => value.includes(opt.value))

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (val: string | number, e: React.MouseEvent) => {
        e.stopPropagation()
        if (value.includes(val)) {
            onChange(value.filter((v) => v !== val))
        } else {
            onChange([...value, val])
        }
    }

    const handleRemoveOption = (e: React.MouseEvent, val: string | number) => {
        e.stopPropagation()
        onChange(value.filter((v) => v !== val))
    }

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
    }

    const handleToggleOpen = () => {
        if (disabled) return
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
                </label>
            )}

            <div
                onClick={handleToggleOpen}
                className={[
                    'w-full flex items-center justify-between gap-2 bg-surface-raised border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-text-primary text-left transition-all outline-none min-h-[34px]',
                    isOpen
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-text-placeholder',
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                ].join(' ')}
            >
                <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
                    {selectedOptions.length === 0 ? (
                        <span className="text-text-placeholder font-medium select-none">
                            {placeholder}
                        </span>
                    ) : (
                        selectedOptions.map((opt) => (
                            <span
                                key={String(opt.value)}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-medium"
                            >
                                <span className="truncate max-w-[120px]">
                                    {opt.label}
                                </span>
                                <span
                                    onClick={(e) =>
                                        handleRemoveOption(e, opt.value)
                                    }
                                    className="p-0.5 hover:bg-primary/25 rounded-full text-primary transition-colors cursor-pointer"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </span>
                            </span>
                        ))
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedOptions.length > 0 && (
                        <span
                            onClick={handleClearAll}
                            className="p-0.5 hover:bg-bg/25 rounded-full text-text-placeholder hover:text-text-secondary transition-colors cursor-pointer"
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
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-border shadow-lg rounded-xl overflow-hidden animate-fade-in flex flex-col max-h-60">
                    <div className="p-2 border-b border-border bg-bg/10 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-text-placeholder" />
                        <input
                            type="text"
                            placeholder="Search..."
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
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value)
                                return (
                                    <button
                                        key={String(option.value)}
                                        type="button"
                                        onClick={(e) =>
                                            handleSelect(option.value, e)
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
