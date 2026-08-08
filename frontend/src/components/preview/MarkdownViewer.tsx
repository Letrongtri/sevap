import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AlertCircle, Code, Eye, FileText, Loader2 } from 'lucide-react'

interface MarkdownViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
    file,
    zoom = 100,
}) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [content, setContent] = useState<string>('')
    const [showRaw, setShowRaw] = useState<boolean>(false)

    useEffect(() => {
        const loadMarkdown = async () => {
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
                    throw new Error('Dữ liệu Markdown không hợp lệ')
                }

                setContent(text)
                setLoading(false)
            } catch (err: any) {
                console.error('Error loading Markdown:', err)
                setError(err.message || 'Không thể đọc nội dung file Markdown')
                setLoading(false)
            }
        }

        loadMarkdown()
    }, [file])

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                    Đang định dạng văn bản Markdown (.md)...
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
                        Lỗi hiển thị Markdown
                    </h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden">
            {/* Header toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white text-xs shadow-xs border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">
                        Tài liệu Markdown (.md)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            showRaw
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {showRaw ? (
                            <Eye className="w-3.5 h-3.5 mr-1" />
                        ) : (
                            <Code className="w-3.5 h-3.5 mr-1" />
                        )}
                        {showRaw ? 'Xem Giao diện Render' : 'Xem Raw Source'}
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
                <div
                    className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 p-6 sm:p-10 transition-transform duration-150 origin-top"
                    style={{ transform: `scale(${zoom / 100})` }}
                >
                    {showRaw ? (
                        <pre className="text-xs text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap overflow-x-auto">
                            {content}
                        </pre>
                    ) : (
                        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-indigo-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-600 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </article>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MarkdownViewer
