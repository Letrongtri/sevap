import React, { useState, useRef } from 'react'
import DocxViewer from './DocxViewer'
import ExcelViewer from './ExcelViewer'
import PdfViewer from './PdfViewer'
import PptxViewer from './PptxViewer'
import HtmlViewer from './HtmlViewer'
import MarkdownViewer from './MarkdownViewer'
import TextViewer from './TextViewer'
import PreviewToolbar from './PreviewToolbar'
import { AlertTriangle, Download, Info, X } from 'lucide-react'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../lib/permissions'
import { toast } from 'sonner'
import { useParams } from '@tanstack/react-router'
import type { ID } from '../../types/common'
import { useDownloadDocument } from '../../hooks/useDocuments'

interface DocumentPreviewerProps {
    file: File | Blob | ArrayBuffer
    fileName: string
    fileSize?: number
    fileType?: string
}

export const DocumentPreviewer: React.FC<DocumentPreviewerProps> = ({
    file,
    fileName,
    fileSize,
    fileType,
}) => {
    const { documentId } = useParams({
        strict: false,
    }) as { documentId?: ID }

    const id = documentId || null

    const wrapperRef = useRef<HTMLDivElement>(null)
    const [zoom, setZoom] = useState<number>(100)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
    const canDownload = usePermission(PERMISSIONS.DOCUMENTS_DOWNLOAD)

    // Handle extension routing
    const ext = fileName.split('.').pop()?.toLowerCase() || ''

    const handleZoomIn = () => setZoom((prev) => Math.min(250, prev + 15))
    const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 15))
    const handleZoomReset = () => setZoom(100)

    const toggleFullscreen = () => {
        if (!wrapperRef.current) return
        if (!document.fullscreenElement) {
            wrapperRef.current
                .requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(console.error)
        } else {
            document
                .exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch(console.error)
        }
    }

    const downloadMutation = useDownloadDocument()

    const handleDownload = () => {
        if (!id) return
        downloadMutation.mutate(
            { id, fileName: fileName },
            {
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Tải tệp tài liệu thất bại.'
                    )
                },
            }
        )
    }

    const renderViewerByExtension = () => {
        switch (ext) {
            case 'docx':
            case 'doc':
                return <DocxViewer file={file} zoom={zoom} />
            case 'xlsx':
            case 'xls':
            case 'csv':
                return <ExcelViewer file={file} zoom={zoom} />
            case 'pdf':
                return <PdfViewer file={file} zoom={zoom} />
            case 'pptx':
            case 'ppt':
                return <PptxViewer file={file} zoom={zoom} />
            case 'html':
            case 'htm':
                return <HtmlViewer file={file} zoom={zoom} />
            case 'md':
            case 'markdown':
                return <MarkdownViewer file={file} zoom={zoom} />
            case 'txt':
            case 'text':
            case 'log':
                return <TextViewer file={file} zoom={zoom} />
            default:
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                        <h4 className="font-semibold text-lg text-slate-800 mb-1">
                            Định dạng tệp không có bộ xem trực tiếp
                        </h4>
                        <p className="text-sm text-slate-500 max-w-md mb-6">
                            Định dạng <strong>.{ext}</strong> hiện không được
                            xem trực tiếp trong trình duyệt. Bạn có thể tải file
                            về máy để mở bằng ứng dụng tương ứng.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4 mr-2" /> Tải về{' '}
                            {fileName}
                        </button>
                    </div>
                )
        }
    }

    return (
        <div
            ref={wrapperRef}
            className="relative w-full h-full flex flex-col bg-white overflow-hidden"
        >
            {/* Top Bar Toolbar */}
            <PreviewToolbar
                fileName={fileName}
                fileSize={
                    fileSize ||
                    (file instanceof File || file instanceof Blob
                        ? file.size
                        : undefined)
                }
                fileType={fileType}
                zoom={zoom}
                canDownload={canDownload}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onDownload={handleDownload}
                onShowInfo={() => setShowInfoModal(true)}
            />

            {/* Viewer Main Body */}
            <div className="flex-1 relative overflow-hidden bg-slate-100">
                {renderViewerByExtension()}
            </div>

            {/* File Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-slide-in-right relative">
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <Info className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-slate-800">
                                    Thông tin tệp
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Chi tiết thông số tệp upload
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">
                                    Tên file:
                                </span>
                                <span className="font-semibold text-slate-800 text-right truncate max-w-xs">
                                    {fileName}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">
                                    Định dạng:
                                </span>
                                <span className="font-semibold text-slate-800 uppercase">
                                    .{ext}
                                </span>
                            </div>
                            {fileSize && (
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">
                                        Dung lượng:
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {(fileSize / 1024).toFixed(1)} KB (
                                        {(fileSize / (1024 * 1024)).toFixed(2)}{' '}
                                        MB)
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-1.5">
                                <span className="text-slate-500 font-medium">
                                    Trạng thái preview:
                                </span>
                                <span className="font-semibold text-emerald-600">
                                    Đã sẵn sàng
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DocumentPreviewer
