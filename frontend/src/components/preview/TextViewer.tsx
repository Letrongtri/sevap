import React, { useEffect, useState, useMemo } from 'react'
import {
    AlertCircle,
    Check,
    Copy,
    FileCode,
    Hash,
    Loader2,
    Search,
    WrapText,
} from 'lucide-react'

interface TextViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const TextViewer: React.FC<TextViewerProps> = ({ file, zoom = 100 }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [text, setText] = useState<string>('')
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true)
    const [wordWrap, setWordWrap] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [copied, setCopied] = useState<boolean>(false)

    useEffect(() => {
        const loadText = async () => {
            setLoading(true)
            setError(null)
            try {
                let str = ''
                if (file instanceof ArrayBuffer) {
                    const decoder = new TextDecoder('utf-8')
                    str = decoder.decode(file)
                } else if (file instanceof Blob) {
                    str = await file.text()
                } else {
                    throw new Error('Dữ liệu văn bản không hợp lệ')
                }

                setText(str)
                setLoading(false)
            } catch (err: any) {
                console.error('Error reading text file:', err)
                setError(err.message || 'Không thể đọc nội dung file TXT')
                setLoading(false)
            }
        }

        loadText()
    }, [file])

    const lines = useMemo(() => {
        return text.split('\n')
    }, [text])

    const wordCount = useMemo(() => {
        if (!text.trim()) return 0
        return text.trim().split(/\s+/).length
    }, [text])

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-slate-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                    Đang nạp file văn bản (.txt)...
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
                        Lỗi xem file TXT
                    </h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden text-xs">
            {/* Header toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-200">
                        Văn bản thuần (.txt)
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 text-[11px]">
                        {lines.length} dòng • {wordCount} từ • {text.length} ký
                        tự
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search field */}
                    <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm từ..."
                            className="w-full pl-8 pr-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                        />
                    </div>

                    {/* Toggle Line numbers */}
                    <button
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            showLineNumbers
                                ? 'bg-slate-700 text-amber-400 border-slate-600'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                        title="Bật/Tắt số dòng"
                    >
                        <Hash className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Word Wrap */}
                    <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            wordWrap
                                ? 'bg-slate-700 text-emerald-400 border-slate-600'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                        title="Tự động xuống dòng (Word Wrap)"
                    >
                        <WrapText className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Text */}
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-slate-300 transition-colors cursor-pointer"
                        title="Sao chép văn bản"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 mr-1" />
                        )}
                        {copied ? 'Đã chép!' : 'Sao chép'}
                    </button>
                </div>
            </div>

            {/* Content Text Display Container */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900 select-text">
                <div
                    className="origin-top-left transition-transform duration-150"
                    style={{ transform: `scale(${zoom / 100})` }}
                >
                    <table className="w-full border-collapse">
                        <tbody>
                            {lines.map((line, idx) => {
                                const isMatch =
                                    searchQuery.trim() &&
                                    line
                                        .toLowerCase()
                                        .includes(
                                            searchQuery.toLowerCase().trim()
                                        )
                                return (
                                    <tr
                                        key={idx}
                                        className={`hover:bg-slate-800/80 transition-colors ${
                                            isMatch ? 'bg-amber-500/20' : ''
                                        }`}
                                    >
                                        {showLineNumbers && (
                                            <td className="w-12 py-0.5 pr-4 text-right select-none text-slate-600 border-r border-slate-800 text-sm">
                                                {idx + 1}
                                            </td>
                                        )}
                                        <td
                                            className={`py-0.5 pl-4 text-slate-300 ${
                                                wordWrap
                                                    ? 'whitespace-pre-wrap break-words'
                                                    : 'whitespace-pre'
                                            }`}
                                        >
                                            {line || ' '}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default TextViewer
