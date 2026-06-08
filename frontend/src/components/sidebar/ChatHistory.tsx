import { Clock, MessageSquare, Search, Trash2 } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useConversations } from '../../hooks/useConversations'
import { useDeleteConversation } from '../../hooks/useDeleteConversation'
import { useNavigate } from '@tanstack/react-router'
import Tooltip from '../ui/Tooltip'

const ChatHistory = ({ collapsed }: { collapsed: boolean }) => {
    const { activeChatId, setActiveChat, searchKeyword, setSearchKeyword } =
        useChatStore()

    // ── Server state (TanStack Query) ──────────────────────────────────
    const { conversations, isLoading: isConvsLoading } = useConversations()
    const { mutate: deleteConv } = useDeleteConversation()
    const navigate = useNavigate()

    const handleSelectChat = (id: number) => {
        setActiveChat(id)
        navigate({
            to: '/chat/$conversationId',
            params: { conversationId: String(id) },
        })
    }

    return (
        <div className="flex-1 overflow-y-auto px-2 py-3 min-h-0">
            {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-disabled select-none">
                    Recent chats
                </p>
            )}

            {/* Search box */}
            {!collapsed && (
                <div className="relative w-full mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
                    <input
                        id="sidebar-chat-search"
                        type="search"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full pl-9 pr-4 py-2 bg-bg border border-transparent rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:bg-surface focus:border-border transition-all duration-200"
                    />
                </div>
            )}

            {collapsed ? (
                /* Collapsed: show single history icon */
                <Tooltip content="Recent chats" position="right">
                    <button className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-text-placeholder hover:text-text-secondary hover:bg-bg transition-all duration-150">
                        <Clock className="w-5 h-5" />
                    </button>
                </Tooltip>
            ) : (
                <div className="space-y-0.5">
                    {/* Loading skeleton */}
                    {isConvsLoading &&
                        Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 px-3 py-2 rounded-xl animate-pulse"
                            >
                                <div className="w-3.5 h-3.5 bg-border/60 rounded mt-0.5 flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-2.5 bg-border/60 rounded w-3/4" />
                                    <div className="h-2 bg-border/40 rounded w-1/3" />
                                </div>
                            </div>
                        ))}

                    {/* Empty state */}
                    {!isConvsLoading && conversations.length === 0 && (
                        <div className="px-3 py-4 text-center">
                            <MessageSquare className="w-6 h-6 text-text-disabled mx-auto mb-1" />
                            <p className="text-xs text-text-placeholder">
                                {searchKeyword
                                    ? 'Không tìm thấy kết quả'
                                    : 'Chưa có cuộc trò chuyện nào'}
                            </p>
                        </div>
                    )}

                    {/* Conversation list */}
                    {!isConvsLoading &&
                        conversations.map(({ id, title, updatedAt }) => (
                            <div
                                key={id}
                                onClick={() => handleSelectChat(id)}
                                className={[
                                    'group flex items-start gap-2 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer',
                                    activeChatId === id
                                        ? 'bg-primary/8 text-primary'
                                        : 'hover:bg-bg',
                                ].join(' ')}
                            >
                                <MessageSquare
                                    className={[
                                        'w-3.5 h-3.5 flex-shrink-0 mt-0.5',
                                        activeChatId === id
                                            ? 'text-primary'
                                            : 'text-text-placeholder',
                                    ].join(' ')}
                                />
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={[
                                            'text-xs truncate leading-snug',
                                            activeChatId === id
                                                ? 'text-primary font-medium'
                                                : 'text-text-secondary',
                                        ].join(' ')}
                                    >
                                        {title}
                                    </p>
                                    <p className="text-[10px] text-text-placeholder mt-0.5">
                                        {new Date(updatedAt).toLocaleDateString(
                                            'vi-VN',
                                            {
                                                day: '2-digit',
                                                month: '2-digit',
                                            }
                                        )}
                                    </p>
                                </div>
                                <button
                                    id={`delete-conv-${id}`}
                                    aria-label="Delete chat"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteConv(id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-placeholder hover:text-error transition-all duration-150 flex-shrink-0"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}

export default ChatHistory
