import { useState, useEffect, useCallback } from 'react'
import { fetchUserOptions } from '../api/user'
import type { UserSimple } from '../types/user'

export function useUserOptions(query: string | null) {
    const [users, setUsers] = useState<UserSimple[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    // Reset list and fetch page 1 when query changes
    useEffect(() => {
        let isMounted = true
        const loadInitial = async () => {
            setIsLoading(true)
            try {
                const res = await fetchUserOptions(query, 1, 10)
                if (isMounted) {
                    setUsers(res.users)
                    setPage(1)
                    setHasMore(res.pagination.page < res.pagination.total_pages)
                }
            } catch (err) {
                console.error('Failed to fetch user options', err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        loadInitial()

        return () => {
            isMounted = false
        }
    }, [query])

    const loadMore = useCallback(async () => {
        if (isLoading || isLoadingMore || !hasMore) return
        setIsLoadingMore(true)
        const nextPage = page + 1
        try {
            const res = await fetchUserOptions(query, nextPage, 10)
            setUsers((prev) => [...prev, ...res.users])
            setPage(nextPage)
            setHasMore(res.pagination.page < res.pagination.total_pages)
        } catch (err) {
            console.error('Failed to load more users', err)
        } finally {
            setIsLoadingMore(false)
        }
    }, [query, page, hasMore, isLoading, isLoadingMore])

    return {
        users,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
    }
}
