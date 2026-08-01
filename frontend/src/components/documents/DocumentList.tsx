import { AlertCircle, File } from 'lucide-react'

import { useDocumentStore } from '../../store/documentStore'
import { useDocuments } from '../../hooks/useDocuments'
import type { Document } from '../../types/document'

import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Pagination from '../ui/Pagination'
import {
    formatBytes,
    formatDateTimeToDDMMYYYY,
    getShortFileType,
} from '../../../utils/formater'

const DocumentList = () => {
    const activeDocumentId = useDocumentStore((d) => d.activeDocumentId)
    const setActiveDocumentId = useDocumentStore((d) => d.setActiveDocumentId)
    const setIsAddingDocument = useDocumentStore((d) => d.setIsAddingDocument)

    const page = useDocumentStore((d) => d.page) || 1
    const setPage = useDocumentStore((d) => d.setPage)
    const limit = useDocumentStore((d) => d.limit) || 10
    const setLimit = useDocumentStore((d) => d.setLimit)

    // Fetch documents (react-query triggers automatically when filters/page/limit change)
    const { documents, isLoading, error, refetch, pagination } = useDocuments()

    const handleSelectDocument = (document: Document) => {
        setIsAddingDocument(false)
        setActiveDocumentId(document.id)
    }

    const statusLabels: Record<string, string> = {
        done: 'Hoàn tất',
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        failed: 'Thất bại',
    }

    const accessLevelLabels: Record<string, string> = {
        public: 'Công khai',
        private: 'Riêng tư',
        managerial: 'Quản lý',
    }

    return (
        <>
            {/* Document list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Đang tải danh sách tài liệu...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Tải danh sách tài liệu thất bại
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {error.message || 'Đã có lỗi xảy ra'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Thử lại
                        </Button>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <File className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            Không tìm thấy tài liệu nào
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-xs">
                            Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    STT
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Tiêu đề
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Loại tệp
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Kích thước
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Trạng thái
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Cấp độ truy cập
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Ngày hiệu lực
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Người tải lên
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Ngày tải lên
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {documents.map((document, index) => {
                                const isSelected =
                                    activeDocumentId === document.id

                                return (
                                    <tr
                                        key={document.id}
                                        onClick={() =>
                                            handleSelectDocument(document)
                                        }
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        {/* Document Identity cell */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        {/* giới hạn chiều rộng của title và file name thành ... nếu quá dài */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                            {document.title}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[200px] truncate">
                                            {getShortFileType(
                                                document.file_type
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[200px] truncate">
                                            {formatBytes(document.file_size)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Badge
                                                variant={
                                                    document.status === 'done'
                                                        ? 'success'
                                                        : document.status ===
                                                            'pending'
                                                          ? 'default'
                                                          : document.status ===
                                                              'processing'
                                                            ? 'warning'
                                                            : 'error'
                                                }
                                                size="sm"
                                                dot
                                            >
                                                {(document?.status && statusLabels[document.status.toLowerCase()]) ||
                                                    document?.status?.toUpperCase() ||
                                                    '-'}
                                            </Badge>
                                        </td>
                                        {/* Access level badge */}
                                        <td className="px-5 py-3.5">
                                            <Badge
                                                variant={
                                                    document.access_level ===
                                                    'public'
                                                        ? 'success'
                                                        : document.access_level ===
                                                            'private'
                                                          ? 'warning'
                                                          : 'error'
                                                }
                                                size="sm"
                                                dot
                                            >
                                                {accessLevelLabels[document?.access_level?.toLowerCase()] ||
                                                    document?.access_level ||
                                                    '-'}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                            {document.effective_date
                                                ? formatDateTimeToDDMMYYYY(
                                                      document.effective_date.toString()
                                                  )
                                                : '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                            {document.uploader?.full_name ||
                                                '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                            {document.created_at
                                                ? formatDateTimeToDDMMYYYY(
                                                      document.created_at.toString()
                                                  )
                                                : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination controls at footer */}
            {!isLoading && !error && documents.length > 0 && pagination && (
                <div className="flex-shrink-0">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        unit="tài liệu"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </>
    )
}

export default DocumentList
