import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface DocxViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ file, zoom = 100 }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const renderDocument = async () => {
        if (!containerRef.current) return
        setLoading(true)
        setError(null)
        try {
            // Clear previous rendered content
            containerRef.current.innerHTML = ''

            let buffer: ArrayBuffer
            if (file instanceof ArrayBuffer) {
                buffer = file
            } else if (file instanceof Blob) {
                buffer = await file.arrayBuffer()
            } else {
                throw new Error('Định dạng file DOCX không hợp lệ')
            }

            await renderAsync(buffer, containerRef.current, undefined, {
                className: 'docx-preview-wrapper',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                experimental: false,
                useBase64URL: true,
            })
            setLoading(false)
        } catch (err: any) {
            console.error('Error rendering docx:', err)
            setError(err.message || 'Không thể hiển thị nội dung file DOCX')
            setLoading(false)
        }
    }

    useEffect(() => {
        renderDocument()
    }, [file])

    return (
        <div className="relative w-full h-full flex flex-col items-center overflow-auto bg-[#F3F4F6] p-4 sm:p-8">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-xs">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                    <p className="text-sm font-medium text-text-secondary">Đang xử lý tài liệu Word (.docx)...</p>
                </div>
            )}

            {error && (
                <div className="my-auto flex flex-col items-center justify-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 mb-2 text-red-500" />
                    <h4 className="font-semibold text-base mb-1">Lỗi xem trước DOCX</h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                    <button
                        onClick={renderDocument}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Thử lại
                    </button>
                </div>
            )}

            <div
                className="transition-transform duration-200 ease-out origin-top shadow-xl rounded-sm bg-white"
                style={{
                    transform: `scale(${zoom / 100})`,
                    display: loading ? 'none' : 'block',
                }}
            >
                <div
                    ref={containerRef}
                    className="docx-viewer-content min-w-[700px] sm:min-w-[800px]"
                />
            </div>
        </div>
    )
}

export default DocxViewer
