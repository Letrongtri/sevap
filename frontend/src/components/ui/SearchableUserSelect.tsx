import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, X, User } from 'lucide-react'
import { useUserOptions } from '../../hooks/useUserOptions'
import { fetchUserById } from '../../api/user'
import type { UserSimple } from '../../types/user'
import LoadingSpinner from './LoadingSpinner'

interface SearchableUserSelectProps {
    value: number | null | undefined
    onChange: (value: number | null) => void
    placeholder?: string
    label?: string
    disabled?: boolean
    className?: string
}

export default function SearchableUserSelect({
    value,
    onChange,
    placeholder = 'Search account...',
    label,
    disabled = false,
    className = '',
}: SearchableUserSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [selectedUserName, setSelectedUserName] = useState('')
    const [prevValue, setPrevValue] = useState(value)

    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Load users with hook
    // If the input search matches the selected name, we don't necessarily want to filter out everything else immediately,
    // but if the user starts typing, we fetch new suggestions.
    const { users, isLoading, isLoadingMore, loadMore } = useUserOptions(
        // If search query is exactly the selected user name, pass empty string to fetch everyone initially.
        // Otherwise, pass the typed search term.
        searchTerm === selectedUserName ? '' : debouncedSearchTerm
    )

    if (value !== prevValue) {
        setPrevValue(value) // Cập nhật lại prevValue để chặn vòng lặp

        // Nếu value bị clear về null/undefined, reset luôn state tại đây
        if (!value) {
            setSelectedUserName('')
            setSearchTerm('')
        }
    }

    // Fetch user name if initial value is provided
    useEffect(() => {
        let isMounted = true

        // Nếu có value mới cần đi fetch API
        if (value) {
            const getUserInfo = async () => {
                try {
                    const user = await fetchUserById(Number(value))
                    if (isMounted) {
                        setSelectedUserName(user.full_name)
                        setSearchTerm(user.full_name)
                    }
                } catch (err) {
                    console.error('Failed to load selected user name', err)
                }
            }
            getUserInfo()
        }

        return () => {
            isMounted = false
        }
    }, [value])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                // Revert search term to selected user name
                setSearchTerm(selectedUserName || '')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [selectedUserName])

    const handleSelect = (user: UserSimple) => {
        setSelectedUserName(user.full_name)
        setSearchTerm(user.full_name)
        onChange(user.id)
        setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedUserName('')
        setSearchTerm('')
        onChange(null)
        setIsOpen(false)
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        if (
            target.scrollHeight - target.scrollTop <=
            target.clientHeight + 15
        ) {
            loadMore()
        }
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    disabled={disabled}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={[
                        'w-full bg-surface-raised border border-border pl-3 pr-14 py-1.5 rounded-xl text-xs font-semibold text-text-primary outline-none transition-all placeholder:text-text-placeholder placeholder:font-medium',
                        isOpen
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'hover:border-text-placeholder',
                        disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-text',
                    ].join(' ')}
                />

                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 hover:bg-bg/25 rounded-full text-text-placeholder hover:text-text-secondary transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={[
                            'w-3.5 h-3.5 text-text-placeholder transition-transform duration-200',
                            isOpen ? 'transform rotate-180 text-primary' : '',
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-border shadow-lg rounded-xl overflow-hidden animate-fade-in flex flex-col max-h-60">
                    <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="overflow-y-auto flex-1 py-1 max-h-56 divide-y divide-[#D4D7DE]/20"
                    >
                        {users.length === 0 && !isLoading ? (
                            <div className="px-3 py-3 text-xs text-text-placeholder text-center">
                                No accounts found
                            </div>
                        ) : (
                            users.map((userOption) => {
                                const isSelected = userOption.id === value
                                return (
                                    <button
                                        key={userOption.id}
                                        type="button"
                                        onClick={() => handleSelect(userOption)}
                                        className={[
                                            'w-full flex items-center gap-2 px-3 py-2 text-xs text-left cursor-pointer transition-colors',
                                            isSelected
                                                ? 'bg-primary/5 text-primary font-bold'
                                                : 'text-text-secondary hover:bg-bg/25 hover:text-text-primary',
                                        ].join(' ')}
                                    >
                                        <User className="w-3.5 h-3.5 text-text-placeholder" />
                                        <div className="flex flex-col truncate">
                                            <span className="font-semibold truncate">
                                                {userOption.full_name}
                                            </span>
                                            <span className="text-[10px] text-text-placeholder truncate">
                                                {userOption.employee_code} •{' '}
                                                {userOption.email || 'No email'}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })
                        )}

                        {(isLoading || isLoadingMore) && (
                            <div className="px-3 py-2 flex items-center justify-center gap-2 text-xs text-text-placeholder bg-bg/5">
                                <LoadingSpinner />
                                <span>Loading...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
