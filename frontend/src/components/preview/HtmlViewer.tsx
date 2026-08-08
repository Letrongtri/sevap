import React, { useEffect, useState } from 'react'
import {
    AlertCircle,
    Code,
    Globe,
    Laptop,
    Loader2,
    Smartphone,
    Tablet,
} from 'lucide-react'

interface HtmlViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export const HtmlViewer: React.FC<HtmlViewerProps> = ({ file, zoom = 100 }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [htmlContent, setHtmlContent] = useState<string>('')
    const [viewport, setViewport] = useState<ViewportMode>('desktop')
    const [showCode, setShowCode] = useState<boolean>(false)

    useEffect(() => {
        const loadHtml = async () => {
            setLoading(true)
            setError(null)
            try {
                let text = ''
                if (file instanceof ArrayBuffer) {
                    const decoder = new TextDecoder('utf-8')
                    text = decoder.decode(file)
                } else if (file instanceof Blob) {
                    text = await file.text()
                } else {
                    throw new Error('Dữ liệu HTML không hợp lệ')
                }

                setHtmlContent(text)
                setLoading(false)
            } catch (err: any) {
                console.error('Error reading HTML file:', err)
                setError(err.message || 'Không thể đọc nội dung file HTML')
                setLoading(false)
            }
        }

        loadHtml()
    }, [file])

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                    Đang tải trang HTML...
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
                        Lỗi xem trước HTML
                    </h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    const getViewportWidth = () => {
        switch (viewport) {
            case 'mobile':
                return 'w-[375px]'
            case 'tablet':
                return 'w-[768px]'
            case 'desktop':
            default:
                return 'w-full'
        }
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Toolbar for HTML Viewport Switcher & Source Code Toggle */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">
                        Xem trước HTML
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Viewport buttons */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setViewport('desktop')}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                viewport === 'desktop'
                                    ? 'bg-cyan-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Desktop View (100%)"
                        >
                            <Laptop className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewport('tablet')}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                viewport === 'tablet'
                                    ? 'bg-cyan-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tablet View (768px)"
                        >
                            <Tablet className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewport('mobile')}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                viewport === 'mobile'
                                    ? 'bg-cyan-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Mobile View (375px)"
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Show HTML Code Toggle */}
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            showCode
                                ? 'bg-cyan-600 text-white border-cyan-500'
                                : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        }`}
                    >
                        <Code className="w-3.5 h-3.5 mr-1" />
                        {showCode ? 'Xem Web Render' : 'Mã nguồn HTML'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
                {showCode ? (
                    <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-auto">
                        <pre className="text-xs text-cyan-300 whitespace-pre-wrap">
                            {htmlContent}
                        </pre>
                    </div>
                ) : (
                    <div
                        className={`transition-all duration-300 ${getViewportWidth()} h-full min-h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 origin-top`}
                        style={{ transform: `scale(${zoom / 100})` }}
                    >
                        <iframe
                            srcDoc={htmlContent}
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full border-none min-h-[600px] bg-white"
                            title="HTML Previewer"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default HtmlViewer
