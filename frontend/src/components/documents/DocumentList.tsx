import { AlertCircle, File } from 'lucide-react'

import { useDocumentStore } from '../../store/documentStore'
import { useDocuments } from '../../hooks/useDocuments'
import type { Document } from '../../types/document'

import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Pagination from '../ui/Pagination'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

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

    return (
        <>
            {/* Document list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Loading documents...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load documents
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {error.message || 'An error occurred'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <File className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            No documents found
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-xs">
                            Try adjusting your search query or filters.
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    ID
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Title
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    File name
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Access Level
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Effective Date
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Uploader
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Uploaded At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {documents.map((document) => {
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
                                            {document.id}
                                        </td>
                                        {/* giới hạn chiều rộng của title và file name thành ... nếu quá dài */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                            {document.title}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[200px] truncate">
                                            {document.file_name}
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
                                                {document.access_level
                                                    ?.charAt(0)
                                                    .toUpperCase() +
                                                    document.access_level?.slice(
                                                        1
                                                    ) || '-'}
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
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </>
    )
}

export default DocumentList
