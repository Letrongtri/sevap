import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Set worker source for pdfjs-dist using bundled local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface PdfViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file, zoom = 100 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [numPages, setNumPages] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [renderingPage, setRenderingPage] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    // Load PDF document
    useEffect(() => {
        let objectUrl: string | null = null
        const loadPdf = async () => {
            setLoading(true)
            setError(null)
            try {
                let buffer: ArrayBuffer
                if (file instanceof ArrayBuffer) {
                    buffer = file
                    const blob = new Blob([file], { type: 'application/pdf' })
                    objectUrl = URL.createObjectURL(blob)
                    setPdfUrl(objectUrl)
                } else if (file instanceof Blob) {
                    buffer = await file.arrayBuffer()
                    objectUrl = URL.createObjectURL(file)
                    setPdfUrl(objectUrl)
                } else {
                    throw new Error('Dữ liệu PDF không hợp lệ')
                }

                const loadingTask = pdfjsLib.getDocument({ data: buffer })
                const pdf = await loadingTask.promise
                setPdfDoc(pdf)
                setNumPages(pdf.numPages)
                setCurrentPage(1)
                setLoading(false)
            } catch (err: any) {
                console.error('Error loading PDF:', err)
                setError(err.message || 'Không thể tải tệp PDF')
                setLoading(false)
            }
        }

        loadPdf()

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [file])

    // Render individual page onto canvas
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return

        let isCancelled = false
        const renderPage = async () => {
            setRenderingPage(true)
            try {
                const page = await pdfDoc.getPage(currentPage)
                if (isCancelled) return

                const scale = (zoom / 100) * 1.5
                const viewport = page.getViewport({ scale })

                const canvas = canvasRef.current
                if (!canvas) return
                const context = canvas.getContext('2d')
                if (!context) return

                canvas.height = viewport.height
                canvas.width = viewport.width

                const renderContext = {
                    canvas,
                    canvasContext: context,
                    viewport: viewport,
                }

                await page.render(renderContext).promise
                if (!isCancelled) {
                    setRenderingPage(false)
                }
            } catch (err: any) {
                if (!isCancelled) {
                    console.error('Error rendering page:', err)
                    setRenderingPage(false)
                }
            }
        }

        renderPage()

        return () => {
            isCancelled = true
        }
    }, [pdfDoc, currentPage, zoom])

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1)
    }

    const handleNextPage = () => {
        if (currentPage < numPages) setCurrentPage((prev) => prev + 1)
    }

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                    Đang tải tài liệu PDF...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 mb-2 text-red-500" />
                    <h4 className="font-semibold text-base mb-1">
                        Lỗi hiển thị PDF
                    </h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-64 rounded-lg border border-slate-300 mt-2"
                            title="PDF Preview Fallback"
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-200 overflow-hidden">
            {/* PDF Sub-Toolbar: Page selector */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white shadow-md z-10">
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-300">Trang:</span>
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Trang trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="bg-slate-800 px-2.5 py-0.5 rounded-md text-slate-100 font-medium">
                        {currentPage} / {numPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage >= numPages}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Trang sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {renderingPage && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang
                        render...
                    </div>
                )}
            </div>

            {/* Canvas Viewer Container */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
                <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-300 relative transition-all">
                    <canvas ref={canvasRef} className="block max-w-none" />
                </div>
            </div>
        </div>
    )
}

export default PdfViewer
