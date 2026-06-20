import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, X, User, Check } from 'lucide-react'
import { useUserOptions } from '../../hooks/useUserOptions'
import type { UserSimple } from '../../types/user'
import LoadingSpinner from './LoadingSpinner'
import type { ID } from '../../types/common'

interface SearchableUserMultiSelectProps {
    value: ID[]
    onChange: (value: ID[]) => void
    initialSelectedUsers?: UserSimple[]
    placeholder?: string
    label?: string
    disabled?: boolean
    className?: string
}

export default function SearchableUserMultiSelect({
    value = [],
    onChange,
    initialSelectedUsers = [],
    placeholder = 'Search accounts...',
    label,
    disabled = false,
    className = '',
}: SearchableUserMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

    const [selectedUsers, setSelectedUsers] =
        useState<UserSimple[]>(initialSelectedUsers)
    const [prevInitialIds, setPrevInitialIds] = useState(() =>
        initialSelectedUsers.map((u) => u.id).join(',')
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Sync selectedUsers details when initialSelectedUsers changes during render
    const currentInitialIds = initialSelectedUsers.map((u) => u.id).join(',')
    if (currentInitialIds !== prevInitialIds) {
        setPrevInitialIds(currentInitialIds)
        setSelectedUsers((prev) => {
            const merged = [...prev]
            initialSelectedUsers.forEach((u) => {
                if (!merged.some((m) => m.id === u.id)) {
                    merged.push(u)
                }
            })
            return merged.filter((m) => value.includes(m.id))
        })
    }

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Fetch users with hook
    const { users, isLoading, isLoadingMore, loadMore } =
        useUserOptions(debouncedSearchTerm)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (user: UserSimple) => {
        const isSelected = value.includes(user.id)
        if (isSelected) {
            onChange(value.filter((id) => id !== user.id))
            setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
        } else {
            onChange([...value, user.id])
            setSelectedUsers((prev) => {
                if (prev.some((u) => u.id === user.id)) return prev
                return [...prev, user]
            })
        }
    }

    const handleRemoveOption = (e: React.MouseEvent, userId: ID) => {
        e.stopPropagation()
        onChange(value.filter((id) => id !== userId))
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
    }

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
        setSelectedUsers([])
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

    const displayedSelectedUsers = selectedUsers.filter((u) =>
        value.includes(u.id)
    )

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {label}
                </label>
            )}

            <div
                onClick={() => !disabled && setIsOpen(true)}
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
                    {displayedSelectedUsers.length === 0 ? (
                        <span className="text-text-placeholder font-medium select-none">
                            {placeholder}
                        </span>
                    ) : (
                        displayedSelectedUsers.map((user) => (
                            <span
                                key={user.id}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-medium"
                            >
                                <span className="truncate max-w-[120px]">
                                    {user.full_name}
                                </span>
                                <span
                                    onClick={(e) =>
                                        handleRemoveOption(e, user.id)
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
                    {displayedSelectedUsers.length > 0 && (
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
                        <User className="w-3.5 h-3.5 text-text-placeholder" />
                        <input
                            type="text"
                            placeholder="Type to search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-placeholder"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="p-0.5 text-text-placeholder hover:text-text-secondary"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="overflow-y-auto flex-1 py-1 max-h-48 divide-y divide-[#D4D7DE]/20"
                    >
                        {users.length === 0 && !isLoading ? (
                            <div className="px-3 py-3 text-xs text-text-placeholder text-center">
                                No accounts found
                            </div>
                        ) : (
                            users.map((userOption) => {
                                const isSelected = value.includes(userOption.id)
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
                                        <div className="flex flex-col truncate flex-1">
                                            <span className="font-semibold truncate">
                                                {userOption.full_name}
                                            </span>
                                            <span className="text-[10px] text-text-placeholder truncate">
                                                {userOption.employee_code} •{' '}
                                                {userOption.email || 'No email'}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                        )}
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
