import { useState } from 'react'
import {
    Clock,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Pencil,
    Search,
    Trash2,
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useConversations } from '../../hooks/useConversations'
import { useDeleteConversation } from '../../hooks/useDeleteConversation'
import { useUpdateConversation } from '../../hooks/useUpdateConversation'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import Tooltip from '../ui/Tooltip'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { ID } from '../../types/common'
import type { Conversation } from '../../types/chat'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'
import { PRIVATE_ROUTES } from '../../routes/paths'

const ChatHistory = ({
    collapsed,
    currentPath,
}: {
    collapsed: boolean
    currentPath?: string
}) => {
    const { activeChatId, setActiveChat, searchKeyword, setSearchKeyword } =
        useChatStore()

    const [activeMenuId, setActiveMenuId] = useState<ID | null>(null)
    const [renamingConv, setRenamingConv] = useState<Conversation | null>(null)
    const [renameTitle, setRenameTitle] = useState('')

    const routerState = useRouterState()
    const path = currentPath ?? routerState.location.pathname
    const isChatRoute = path.startsWith(PRIVATE_ROUTES.CHAT)

    // ── Server state (TanStack Query) ──────────────────────────────────
    const {
        conversations,
        isLoading: isConvsLoading,
        error,
        refetch,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useConversations()
    const { mutate: deleteConv } = useDeleteConversation()
    const updateConvMutation = useUpdateConversation()
    const navigate = useNavigate()

    const handleSelectChat = (id: ID) => {
        setActiveChat(id)
        navigate({
            to: '/chat/$conversationId',
            params: { conversationId: String(id) },
        })
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        // Load next page when scrolling is within 30px of the bottom
        if (scrollHeight - scrollTop - clientHeight < 30) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        }
    }

    const handleOpenRenameModal = (conv: Conversation) => {
        setRenamingConv(conv)
        setRenameTitle(conv.title)
    }

    const handleSaveRename = () => {
        if (!renamingConv || !renameTitle.trim()) return
        updateConvMutation.mutate(
            { id: renamingConv.id, title: renameTitle.trim() },
            {
                onSuccess: () => {
                    setRenamingConv(null)
                },
            }
        )
    }

    return (
        <div
            className="flex-1 overflow-y-auto px-2 py-3 min-h-0"
            onScroll={handleScroll}
        >
            {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-disabled select-none">
                    Gần đây
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
                        placeholder="Tìm cuộc trò chuyện..."
                        className="w-full pl-9 pr-4 py-2 bg-bg border border-transparent rounded-xl text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:bg-surface focus:border-border transition-all duration-200"
                    />
                </div>
            )}

            {collapsed ? (
                /* Collapsed: show single history icon */
                <Tooltip content="Gần đây" position="right">
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

                    {error && (
                        <div className="px-3 py-4 flex flex-col items-center">
                            <p className="text-xs text-text-placeholder">
                                Đã có lỗi xảy ra
                            </p>
                            <button
                                onClick={() => refetch()}
                                className="mt-2 px-3 py-1 bg-primary/8 rounded-xl text-xs text-primary hover:bg-primary transition-all duration-150"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Conversation list */}
                    {!isConvsLoading &&
                        conversations.map((conv) => {
                            const isItemActive =
                                isChatRoute && activeChatId === conv.id
                            const isMenuOpen = activeMenuId === conv.id

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => handleSelectChat(conv.id)}
                                    className={[
                                        'group flex items-start gap-2 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer relative',
                                        isItemActive
                                            ? 'bg-primary/8 text-primary'
                                            : 'hover:bg-bg',
                                    ].join(' ')}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={[
                                                'text-xs truncate leading-snug',
                                                isItemActive
                                                    ? 'text-primary font-medium'
                                                    : 'text-text-secondary',
                                            ].join(' ')}
                                        >
                                            {conv.title}
                                        </p>
                                        <p className="text-[10px] text-text-placeholder mt-0.5">
                                            {formatDateTimeToDDMMYYYY(
                                                conv.updatedAt
                                            )}
                                        </p>
                                    </div>

                                    {/* More action menu */}
                                    <div
                                        className="relative flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            id={`more-conv-${conv.id}`}
                                            aria-label="Tùy chọn khác"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveMenuId(
                                                    isMenuOpen ? null : conv.id
                                                )
                                            }}
                                            className={[
                                                'p-1 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-surface transition-all duration-150',
                                                isMenuOpen
                                                    ? 'opacity-100 bg-surface text-text-primary'
                                                    : 'opacity-0 group-hover:opacity-100',
                                            ].join(' ')}
                                        >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>

                                        {isMenuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveMenuId(null)
                                                    }}
                                                />
                                                <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-surface border border-border shadow-lg rounded-xl py-1 text-xs text-text-primary animate-scale-pop">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveMenuId(
                                                                null
                                                            )
                                                            handleOpenRenameModal(
                                                                conv
                                                            )
                                                        }}
                                                        className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-bg text-left transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 text-text-muted" />
                                                        <span>Đổi tên</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveMenuId(
                                                                null
                                                            )
                                                            deleteConv(conv.id)
                                                        }}
                                                        className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-bg text-error text-left transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Xóa</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                    {/* Next page loading indicator */}
                    {isFetchingNextPage && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-text-placeholder" />
                        </div>
                    )}
                </div>
            )}

            {/* Modal Rename Conversation */}
            {renamingConv && (
                <Modal
                    isOpen={!!renamingConv}
                    onClose={() => setRenamingConv(null)}
                    title="Đổi tên cuộc trò chuyện"
                    size="sm"
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setRenamingConv(null)}
                                disabled={updateConvMutation.isPending}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveRename}
                                isLoading={updateConvMutation.isPending}
                                disabled={!renameTitle.trim()}
                            >
                                Lưu
                            </Button>
                        </>
                    }
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveRename()
                        }}
                        className="space-y-4"
                    >
                        <Input
                            label="Tên cuộc trò chuyện"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            placeholder="Nhập tên cuộc trò chuyện..."
                            autoFocus
                        />
                    </form>
                </Modal>
            )}
        </div>
    )
}

export default ChatHistory
