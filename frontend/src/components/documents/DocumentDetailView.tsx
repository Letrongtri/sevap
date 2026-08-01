import React from 'react'
import {
    Edit,
    Trash2,
    FileText,
    Calendar,
    User,
    Shield,
    Building,
    Clock,
    Info,
    Loader2,
    Download,
} from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'
import { getShortFileType } from '../../../utils/formater'
import { formatBytes } from '../../../utils/formater'
import type { Document } from '../../types/document'

interface DocumentDetailViewProps {
    document: Document
    setIsEditing: (val: boolean) => void
    setShowDeleteConfirm: (val: boolean) => void
    showDeleteConfirm: boolean
    handleDelete: () => void
    isSubmitting: boolean
    handleDownload: () => void
    isDownloading: boolean
}

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
    document,
    setIsEditing,
    setShowDeleteConfirm,
    showDeleteConfirm,
    handleDelete,
    isSubmitting,
    handleDownload,
    isDownloading,
}) => {
    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'done':
                return (
                    <Badge variant="success" dot>
                        Hoàn tất
                    </Badge>
                )
            case 'processing':
                return (
                    <Badge variant="warning" dot>
                        Đang xử lý
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="info" dot>
                        Chờ xử lý
                    </Badge>
                )
            case 'failed':
                return (
                    <Badge variant="error" dot>
                        Thất bại
                    </Badge>
                )
            default:
                return (
                    <Badge variant="default">
                        {status || 'Không xác định'}
                    </Badge>
                )
        }
    }

    const getAccessLevelBadge = (level: string | null) => {
        switch (level) {
            case 'public':
                return <Badge variant="success">Công khai</Badge>
            case 'private':
                return <Badge variant="warning">Riêng tư</Badge>
            case 'managerial':
                return <Badge variant="error">Quản lý</Badge>
            default:
                return <Badge variant="default">{level || '-'}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                    <FileText className="w-8 h-8" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-text-primary leading-snug break-words">
                        {document.title}
                    </h3>
                    <p className="text-xs text-text-placeholder mt-0.5 truncate">
                        {document.category || 'Tài liệu chung'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getStatusBadge(document.status)}
                        {getAccessLevelBadge(document.access_level)}
                    </div>
                </div>
            </div>

            {/* Processing State Alert */}
            {(document.status === 'processing' ||
                document.status === 'pending') && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3 animate-pulse">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary animate-spin">
                        <Loader2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-primary">
                            Đang xử lý tài liệu...
                        </h4>
                        <p className="text-[10px] text-text-secondary leading-normal">
                            Tài liệu đang được phân tích và lưu vào cơ sở dữ
                            liệu vector ở nền. Tính năng Q&A sẽ sẵn sàng sau khi
                            hoàn tất.
                        </p>
                    </div>
                </div>
            )}

            {/* General Metadata grid */}
            <div className="bg-bg/10 rounded-2xl border border-border/40 p-4 space-y-3.5 text-xs text-text-secondary">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-placeholder">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tên tệp</span>
                    </div>
                    <span className="font-semibold text-text-primary text-right truncate max-w-[180px]">
                        {document.file_name?.substring(
                            document.file_name.indexOf('_') + 1
                        ) || '-'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-placeholder">
                        <Info className="w-3.5 h-3.5" />
                        <span>Chi tiết tệp</span>
                    </div>
                    <span className="font-semibold text-text-primary text-right">
                        {getShortFileType(document.file_type)} •{' '}
                        {formatBytes(document.file_size)}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-placeholder">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ngày hiệu lực</span>
                    </div>
                    <span className="font-semibold text-text-primary text-right">
                        {document.effective_date
                            ? formatDateTimeToDDMMYYYY(document.effective_date)
                            : '-'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-placeholder">
                        <User className="w-3.5 h-3.5" />
                        <span>Người tải lên</span>
                    </div>
                    <span className="font-semibold text-text-primary text-right truncate max-w-[150px]">
                        {document.uploader?.full_name || '-'}
                    </span>
                </div>
            </div>

            {/* Access control details for Private documents */}
            {document.access_level === 'private' && (
                <div className="border border-border/40 rounded-2xl p-4 bg-bg/5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                        <Shield className="w-4 h-4 text-warning" />
                        <span>Cấu hình giới hạn truy cập</span>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-text-placeholder flex items-center gap-1">
                                <Building className="w-3.5 h-3.5" />
                                Phòng ban được phép:
                            </span>
                            <div className="flex flex-wrap gap-1 pl-4.5">
                                {document.departments &&
                                document.departments.length > 0 ? (
                                    document.departments.map((d) => (
                                        <Badge
                                            key={d.id}
                                            variant="primary"
                                            size="sm"
                                        >
                                            {d.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-text-placeholder italic">
                                        Không giới hạn phòng ban
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-text-placeholder flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                Vai trò được phép:
                            </span>
                            <div className="flex flex-wrap gap-1 pl-4.5">
                                {document.roles && document.roles.length > 0 ? (
                                    document.roles.map((r) => (
                                        <Badge
                                            key={r.id}
                                            variant="primary"
                                            size="sm"
                                        >
                                            {r.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-text-placeholder italic">
                                        Không giới hạn vai trò
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-text-placeholder flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                Tài khoản được phép:
                            </span>
                            <div className="flex flex-wrap gap-1 pl-4.5">
                                {document.target_users &&
                                document.target_users.length > 0 ? (
                                    document.target_users.map((u) => (
                                        <Badge
                                            key={u.id}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            {u.full_name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-text-placeholder italic">
                                        Không giới hạn tài khoản
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-border/60 pt-4 space-y-2 text-[10px] text-text-placeholder leading-relaxed">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-placeholder/60" />
                    <span>
                        Tạo lúc:{' '}
                        {new Date(document.created_at).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-placeholder/60" />
                    <span>
                        Cập nhật gần nhất:{' '}
                        {new Date(document.updated_at).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            {!showDeleteConfirm ? (
                <div className="space-y-2.5 pt-2">
                    <Button
                        variant="primary"
                        fullWidth
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={handleDownload}
                        isLoading={isDownloading}
                        loadingText="Đang tải về..."
                    >
                        Xem / Tải về tài liệu
                    </Button>
                    <div className="flex gap-2.5">
                        <Button
                            variant="secondary"
                            fullWidth
                            leftIcon={<Edit className="w-4 h-4" />}
                            onClick={() => setIsEditing(true)}
                            disabled={
                                document.status === 'processing' ||
                                document.status === 'pending'
                            }
                        >
                            Sửa
                        </Button>
                        <Button
                            variant="danger"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Xóa
                        </Button>
                    </div>
                </div>
            ) : (
                /* Delete Confirmation */
                <div className="p-3.5 bg-error-bg/30 border border-error-border/60 rounded-xl space-y-2.5 animate-fade-in">
                    <p className="text-xs font-semibold text-error-text">
                        Xác nhận xóa tài liệu?
                    </p>
                    <p className="text-[10px] text-text-secondary leading-normal">
                        Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tài
                        liệu cùng các phân đoạn vector liên quan.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            isLoading={isSubmitting}
                            loadingText="Đang xóa..."
                            fullWidth
                        >
                            Xác nhận xóa
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isSubmitting}
                            fullWidth
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DocumentDetailView
