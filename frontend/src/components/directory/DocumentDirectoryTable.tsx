import { useState } from 'react'
import {
    AlertCircle,
    FileText,
    Eye,
    Download,
    Lock,
    Globe,
    Shield,
    Calendar,
    User as UserIcon,
    HardDrive,
} from 'lucide-react'
import { useDirectoryStore } from '../../store/directoryStore'
import { useDirectoryDocuments } from '../../hooks/useDirectory'
import { useDirectoryPermissions } from '../../hooks/useDirectoryPermissions'
import { downloadDocumentFile } from '../../api/document'
import type { Document } from '../../types/document'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Pagination from '../ui/Pagination'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { DirectoryTab } from '../../types/directory'
import {
    formatBytes,
    formatDateTimeToDDMMYYYY,
    getShortFileType,
} from '../../../utils/formater'

const DocumentDirectoryTable = () => {
    const activeTab = useDirectoryStore((s) => s.activeTab)
    const page = useDirectoryStore((s) => s.page) || 1
    const setPage = useDirectoryStore((s) => s.setPage)
    const limit = useDirectoryStore((s) => s.limit) || 10
    const setLimit = useDirectoryStore((s) => s.setLimit)

    const { canDownloadDocuments } = useDirectoryPermissions()

    const { data, isLoading, error, refetch } = useDirectoryDocuments({
        enabled: activeTab === DirectoryTab.Documents,
    })

    const documents = data?.documents || []
    const pagination = data?.pagination

    // Detail Modal state
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [downloadError, setDownloadError] = useState<string | null>(null)

    const handleDownload = async (doc: Document) => {
        if (!canDownloadDocuments) return
        try {
            setDownloadingId(doc.id)
            setDownloadError(null)
            const cleanFileName =
                doc.file_name?.substring(doc.file_name.indexOf('_') + 1) ||
                `${doc.title}.docx`
            await downloadDocumentFile(doc.id, cleanFileName)
        } catch (err: any) {
            setDownloadError(
                err?.response?.data?.detail || 'Tải xuống tài liệu thất bại.'
            )
        } finally {
            setDownloadingId(null)
        }
    }

    const getAccessLevelBadge = (accessLevel: string) => {
        switch (accessLevel) {
            case 'public':
                return (
                    <Badge
                        variant="success"
                        className="inline-flex items-center gap-1"
                    >
                        <Globe className="w-3 h-3" />
                        Công khai
                    </Badge>
                )
            case 'managerial':
                return (
                    <Badge
                        variant="warning"
                        className="inline-flex items-center gap-1"
                    >
                        <Shield className="w-3 h-3" />
                        Quản lý
                    </Badge>
                )
            case 'private':
                return (
                    <Badge
                        variant="error"
                        className="inline-flex items-center gap-1"
                    >
                        <Lock className="w-3 h-3" />
                        Riêng tư
                    </Badge>
                )
            default:
                return <Badge variant="error">{accessLevel}</Badge>
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải danh sách tài liệu...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Tải danh sách tài liệu thất bại
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    {error instanceof Error
                        ? error.message
                        : 'Đã có lỗi xảy ra'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Thử lại
                </Button>
            </div>
        )
    }

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <FileText className="w-10 h-10 text-text-placeholder" />
                <h3 className="text-base font-semibold text-text-secondary">
                    Không tìm thấy tài liệu nào
                </h3>
                <p className="text-sm text-text-placeholder max-w-xs">
                    Thử điều chỉnh từ khóa tìm kiếm hoặc kiểm tra lại quyền truy
                    cập.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {downloadError && (
                <div className="p-3 mx-4 mt-3 bg-error-bg border border-error-border text-error-text rounded-xl text-xs flex items-center justify-between">
                    <span>{downloadError}</span>
                    <button
                        onClick={() => setDownloadError(null)}
                        className="text-error-text hover:underline ml-2"
                    >
                        Đóng
                    </button>
                </div>
            )}

            {/* Table container */}
            <div className="overflow-auto min-h-0 flex-1">
                <table className="w-full border-separate border-spacing-0 text-left">
                    <thead>
                        <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                STT
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Tên tài liệu
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Thể loại
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Loại tệp
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Dung lượng
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Quyền truy cập
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Ngày hiệu lực
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold text-right">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D7DE]/40">
                        {documents.map((doc, index) => (
                            <tr
                                key={doc.id}
                                className="group hover:bg-bg/20 transition-colors duration-150"
                            >
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {(page - 1) * limit + index + 1}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span
                                            className="cursor-pointer hover:underline"
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            {doc.title}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {doc.category || (
                                        <span className="italic text-text-placeholder">
                                            Chưa phân loại
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-surface-raised border border-border text-text-secondary">
                                        {getShortFileType(doc.file_type)}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {formatBytes(doc.file_size)}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {getAccessLevelBadge(doc.access_level)}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {doc.effective_date ? (
                                        formatDateTimeToDDMMYYYY(
                                            doc.effective_date
                                        )
                                    ) : (
                                        <span className="italic text-text-placeholder">
                                            Vô thời hạn
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedDoc(doc)}
                                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            disabled={
                                                !canDownloadDocuments ||
                                                downloadingId === doc.id
                                            }
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                canDownloadDocuments
                                                    ? 'text-text-muted hover:text-primary hover:bg-primary/10 cursor-pointer'
                                                    : 'text-text-placeholder/40 cursor-not-allowed'
                                            }`}
                                            title={
                                                canDownloadDocuments
                                                    ? 'Tải xuống tài liệu'
                                                    : 'Bạn không có quyền tải xuống tài liệu này'
                                            }
                                        >
                                            {downloadingId === doc.id ? (
                                                <LoadingSpinner />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            {pagination && (
                <div className="flex-shrink-0 border-t border-[#D4D7DE]/40 bg-white p-4">
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

            {/* Document Detail Modal */}
            <Modal
                isOpen={!!selectedDoc}
                onClose={() => setSelectedDoc(null)}
                title="Chi tiết tài liệu"
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setSelectedDoc(null)}
                        >
                            Đóng
                        </Button>
                        {canDownloadDocuments && selectedDoc && (
                            <Button
                                variant="primary"
                                onClick={() => handleDownload(selectedDoc)}
                                disabled={downloadingId === selectedDoc.id}
                            >
                                {downloadingId === selectedDoc.id ? (
                                    <LoadingSpinner />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Tải xuống tài liệu
                            </Button>
                        )}
                    </div>
                }
            >
                {selectedDoc && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">
                                {selectedDoc.title}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-bg/50 p-4 rounded-xl border border-border/50 text-sm">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <HardDrive className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">
                                    Mã / Tên file:
                                </span>
                            </div>
                            <div className="text-text-primary truncate text-xs">
                                {selectedDoc.file_name || selectedDoc.id}
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <FileText className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">Thể loại:</span>
                            </div>
                            <div className="text-text-primary">
                                {selectedDoc.category || 'Chưa phân loại'}
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <HardDrive className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">
                                    Định dạng & Dung lượng:
                                </span>
                            </div>
                            <div className="text-text-primary">
                                {getShortFileType(selectedDoc.file_type)} (
                                {formatBytes(selectedDoc.file_size)})
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <Shield className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">
                                    Cấp độ truy cập:
                                </span>
                            </div>
                            <div>
                                {getAccessLevelBadge(selectedDoc.access_level)}
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <UserIcon className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">
                                    Người tải lên:
                                </span>
                            </div>
                            <div className="text-text-primary">
                                {selectedDoc.uploader?.full_name || 'Hệ thống'}
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <Calendar className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">
                                    Ngày hiệu lực:
                                </span>
                            </div>
                            <div className="text-text-primary">
                                {selectedDoc.effective_date
                                    ? formatDateTimeToDDMMYYYY(
                                          selectedDoc.effective_date
                                      )
                                    : 'Vô thời hạn'}
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                                <Calendar className="w-4 h-4 text-text-placeholder" />
                                <span className="font-semibold">Ngày tạo:</span>
                            </div>
                            <div className="text-text-primary">
                                {selectedDoc.created_at
                                    ? formatDateTimeToDDMMYYYY(
                                          selectedDoc.created_at
                                      )
                                    : '—'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default DocumentDirectoryTable
