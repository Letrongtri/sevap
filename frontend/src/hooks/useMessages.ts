import { useCallback, useEffect, useReducer } from 'react'
import { fetchConversationDetail, fetchMoreMessages } from '../api/chat'
import type { Message } from '../types/chat'

export const messagesQueryKey = (conversationId: number | null) =>
    ['messages', conversationId] as const

const PAGE_LIMIT = 20

/* ============================================================
   State shape — một object duy nhất, update bằng reducer
   để tránh cascading setState trong effect.
   ============================================================ */

interface MessagesState {
    messages: Message[]
    isLoading: boolean
    isFetchingMore: boolean
    hasMore: boolean
    isError: boolean
    /** Tăng lên để trigger re-fetch khi invalidate() được gọi */
    fetchVersion: number
}

type MessagesAction =
    | { type: 'LOADING_START' }
    | { type: 'LOADED'; messages: Message[] }
    | { type: 'LOAD_ERROR' }
    | { type: 'RESET' }
    | { type: 'FETCH_MORE_START' }
    | { type: 'FETCH_MORE_DONE'; older: Message[] }
    | { type: 'FETCH_MORE_EMPTY' }
    | { type: 'INVALIDATE' }
    | { type: 'APPEND'; msg: Message }
    | { type: 'APPEND_OPTIMISTIC'; msg: Message }

const initialState: MessagesState = {
    messages: [],
    isLoading: false,
    isFetchingMore: false,
    hasMore: false,
    isError: false,
    fetchVersion: 0,
}

function reducer(state: MessagesState, action: MessagesAction): MessagesState {
    switch (action.type) {
        case 'LOADING_START':
            return { ...state, isLoading: true, isError: false }
        case 'LOADED':
            return {
                ...state,
                isLoading: false,
                isError: false,
                // API trả về id giảm dần → đảo ngược để hiển thị cũ → mới
                messages: [...action.messages].reverse(),
                // Nếu có đúng 10, có khả năng còn messages cũ hơn
                hasMore: action.messages.length >= 10,
            }
        case 'LOAD_ERROR':
            return { ...state, isLoading: false, isError: true }
        case 'RESET':
            return initialState
        case 'INVALIDATE':
            // Tăng fetchVersion để useEffect re-run và fetch lại
            return {
                ...initialState,
                fetchVersion: state.fetchVersion + 1,
            }
        case 'FETCH_MORE_START':
            return { ...state, isFetchingMore: true }
        case 'FETCH_MORE_DONE':
            return {
                ...state,
                isFetchingMore: false,
                // older cũng được trả về id giảm dần → đảo ngược trước khi prepend
                messages: [
                    [...action.older].reverse(),
                    ...state.messages,
                ].flat(),
                hasMore: action.older.length >= PAGE_LIMIT,
            }
        case 'FETCH_MORE_EMPTY':
            return { ...state, isFetchingMore: false, hasMore: false }
        case 'APPEND':
            if (state.messages.some((m) => m.id === action.msg.id)) return state
            return { ...state, messages: [...state.messages, action.msg] }
        case 'APPEND_OPTIMISTIC':
            // Thêm message optimistic (id âm) — không kiểm tra duplicate theo id
            return { ...state, messages: [...state.messages, action.msg] }
        default:
            return state
    }
}

/* ============================================================
   Hook
   ============================================================ */

/**
 * useMessages — Hook quản lý messages với infinite scroll ngược (load older).
 *
 * Logic phân trang:
 *  - Lần đầu: gọi GET /conversations/{id} → lấy 10 messages cuối.
 *  - Khi scroll lên gần đầu: gọi GET /conversations/{id}/messages?last_id=<oldestId>&limit=20.
 *  - Messages được prepend (cũ hơn thêm vào đầu danh sách).
 */
export function useMessages(conversationId: number | null) {
    const [state, dispatch] = useReducer(reducer, initialState)

    // ── Initial load (và re-fetch khi fetchVersion thay đổi) ──────────
    useEffect(() => {
        if (conversationId === null) {
            dispatch({ type: 'RESET' })
            return
        }

        let cancelled = false

        const load = async () => {
            dispatch({ type: 'LOADING_START' })

            try {
                const detail = await fetchConversationDetail(conversationId)
                if (cancelled) return

                dispatch({ type: 'LOADED', messages: detail.messages })
            } catch {
                if (!cancelled) dispatch({ type: 'LOAD_ERROR' })
            }
        }

        load()

        return () => {
            cancelled = true
        }
        // fetchVersion thay đổi khi invalidate() được gọi → re-fetch
    }, [conversationId, state.fetchVersion])

    // ── Fetch older messages (scroll up) ──────────────────────────────
    const fetchMore = useCallback(async () => {
        if (!conversationId || state.isFetchingMore || !state.hasMore) return

        const oldestId = state.messages[0]?.id
        if (!oldestId || oldestId < 0) return // bỏ qua optimistic messages

        dispatch({ type: 'FETCH_MORE_START' })
        try {
            const older = await fetchMoreMessages(
                conversationId,
                oldestId,
                PAGE_LIMIT
            )
            if (older.length === 0) {
                dispatch({ type: 'FETCH_MORE_EMPTY' })
                return
            }
            dispatch({ type: 'FETCH_MORE_DONE', older })
        } catch {
            dispatch({ type: 'FETCH_MORE_EMPTY' })
        }
    }, [conversationId, state.isFetchingMore, state.hasMore, state.messages])

    // ── Append message thật (từ server, sau stream) ───────────────────
    const appendMessage = useCallback((msg: Message) => {
        dispatch({ type: 'APPEND', msg })
    }, [])

    // ── Append message optimistic (hiện ngay khi user gửi) ────────────
    const appendOptimistic = useCallback((msg: Message) => {
        dispatch({ type: 'APPEND_OPTIMISTIC', msg })
    }, [])

    // ── Reset khi conversationId thay đổi ─────────────────────────────
    const reset = useCallback(() => {
        dispatch({ type: 'RESET' })
    }, [])

    // ── Invalidate (sau khi send message xong → load lại từ đầu) ──────
    const invalidate = useCallback(() => {
        if (conversationId === null) return
        dispatch({ type: 'INVALIDATE' })
    }, [conversationId])

    return {
        messages: state.messages,
        isLoading: state.isLoading,
        isFetchingMore: state.isFetchingMore,
        hasMore: state.hasMore,
        isError: state.isError,
        fetchMore,
        appendMessage,
        appendOptimistic,
        invalidate,
        reset,
    }
}
