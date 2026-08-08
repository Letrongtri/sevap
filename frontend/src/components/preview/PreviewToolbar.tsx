import React from 'react'
import {
    ArrowLeft,
    Download,
    Info,
    Maximize,
    Minimize,
    ZoomIn,
    ZoomOut,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { formatBytes } from '../../../utils/formater'

interface PreviewToolbarProps {
    fileName: string
    fileSize?: number
    fileType?: string
    zoom: number
    canDownload: boolean
    onZoomIn: () => void
    onZoomOut: () => void
    onZoomReset: () => void
    isFullscreen: boolean
    onToggleFullscreen: () => void
    onDownload: () => void
    onShowInfo: () => void
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
    fileName,
    fileSize,
    zoom,
    canDownload,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    isFullscreen,
    onToggleFullscreen,
    onDownload,
    onShowInfo,
}) => {
    const navigate = useNavigate()
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-[#D4D7DE]/60 shadow-xs z-10">
            {/* File Info */}
            <div className="flex items-center gap-2.5 min-w-0">
                <button
                    onClick={() => navigate({ to: '/documents' })}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
                    title="Quay lại danh sách tài liệu"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h3
                    className="text-sm font-semibold text-text-primary truncate max-w-xs sm:max-w-md"
                    title={fileName}
                >
                    {fileName}
                </h3>
                {fileSize && (
                    <span className="text-xs text-text-tertiary hidden sm:inline-block">
                        ({formatBytes(fileSize)})
                    </span>
                )}
            </div>

            {/* Controls Right */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                    <button
                        onClick={onZoomOut}
                        disabled={zoom <= 50}
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 cursor-pointer transition-colors"
                        title="Thu nhỏ (-)"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onZoomReset}
                        className="px-2 py-0.5 rounded-md text-sm font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
                        title="Đặt lại 100%"
                    >
                        {zoom}%
                    </button>
                    <button
                        onClick={onZoomIn}
                        disabled={zoom >= 250}
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 cursor-pointer transition-colors"
                        title="Phóng to (+)"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* Info */}
                <button
                    onClick={onShowInfo}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Thông tin tài liệu"
                >
                    <Info className="w-4 h-4" />
                </button>

                {/* Download */}
                {canDownload && (
                    <button
                        onClick={onDownload}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                        title="Tải về máy"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Tải về</span>
                    </button>
                )}

                {/* Fullscreen */}
                <button
                    onClick={onToggleFullscreen}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title={
                        isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'
                    }
                >
                    {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                    ) : (
                        <Maximize className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    )
}

export default PreviewToolbar
