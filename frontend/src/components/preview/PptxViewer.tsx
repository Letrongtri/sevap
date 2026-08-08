import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Layout,
    Loader2,
    Play,
    Pause,
    Presentation,
} from 'lucide-react'

interface SlideInfo {
    id: number
    title: string
    texts: string[]
    images: string[] // base64 / blob URLs
}

interface PptxViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const PptxViewer: React.FC<PptxViewerProps> = ({ file, zoom = 100 }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [slides, setSlides] = useState<SlideInfo[]>([])
    const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0)
    const [isPlaying, setIsPlaying] = useState<boolean>(false)

    useEffect(() => {
        const loadPptx = async () => {
            setLoading(true)
            setError(null)
            try {
                let buffer: ArrayBuffer
                if (file instanceof ArrayBuffer) {
                    buffer = file
                } else if (file instanceof Blob) {
                    buffer = await file.arrayBuffer()
                } else {
                    throw new Error('Dữ liệu PPTX không hợp lệ')
                }

                const zip = await JSZip.loadAsync(buffer)
                
                // Find all slide XML files
                const slideFiles = Object.keys(zip.files).filter((path) =>
                    /^ppt\/slides\/slide\d+\.xml$/i.test(path)
                )

                // Sort slide files by index: slide1.xml, slide2.xml...
                slideFiles.sort((a, b) => {
                    const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10)
                    const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10)
                    return numA - numB
                })

                if (slideFiles.length === 0) {
                    throw new Error('Không tìm thấy slide nào trong tệp PPTX')
                }

                // Extract slide images in media directory if any
                const mediaFiles = Object.keys(zip.files).filter((path) =>
                    /^ppt\/media\//i.test(path)
                )
                const mediaMap: Record<string, string> = {}
                for (const mediaPath of mediaFiles) {
                    const fileObj = zip.files[mediaPath]
                    if (fileObj && !fileObj.dir) {
                        const blob = await fileObj.async('blob')
                        const url = URL.createObjectURL(blob)
                        mediaMap[mediaPath.toLowerCase()] = url
                    }
                }

                const parser = new DOMParser()
                const parsedSlides: SlideInfo[] = []

                for (let i = 0; i < slideFiles.length; i++) {
                    const path = slideFiles[i]
                    const xmlStr = await zip.files[path].async('string')
                    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml')

                    // Extract all text nodes <a:t>
                    const tElements = xmlDoc.getElementsByTagName('a:t')
                    const textLines: string[] = []
                    for (let j = 0; j < tElements.length; j++) {
                        const txt = tElements[j].textContent?.trim()
                        if (txt) {
                            textLines.push(txt)
                        }
                    }

                    // First prominent text line as slide title, or fallback
                    const title = textLines.length > 0 ? textLines[0] : `Slide ${i + 1}`
                    const bodyTexts = textLines.length > 1 ? textLines.slice(1) : []

                    // Match referenced slide images if any
                    const slideImages: string[] = Object.values(mediaMap)

                    parsedSlides.push({
                        id: i + 1,
                        title,
                        texts: bodyTexts,
                        images: slideImages,
                    })
                }

                setSlides(parsedSlides)
                setActiveSlideIdx(0)
                setLoading(false)
            } catch (err: any) {
                console.error('Error parsing PPTX:', err)
                setError(err.message || 'Không thể giải nén hoặc hiển thị slide PowerPoint')
                setLoading(false)
            }
        }

        loadPptx()
    }, [file])

    // Slideshow autoplay timer
    useEffect(() => {
        if (!isPlaying || slides.length <= 1) return
        const timer = setInterval(() => {
            setActiveSlideIdx((prev) => (prev + 1) % slides.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [isPlaying, slides.length])

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">Đang trích xuất Slide PowerPoint (.pptx)...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 mb-2 text-red-500" />
                    <h4 className="font-semibold text-base mb-1">Lỗi đọc file PPTX</h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    const currentSlide = slides[activeSlideIdx]

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-slate-200">
                        Thuyết trình PowerPoint ({slides.length} slides)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                            isPlaying
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                    >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {isPlaying ? 'Tạm dừng' : 'Trình chiếu'}
                    </button>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveSlideIdx((prev) => Math.max(0, prev - 1))}
                            disabled={activeSlideIdx <= 0}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="bg-slate-800 px-2.5 py-0.5 rounded-md text-slate-200">
                            {activeSlideIdx + 1} / {slides.length}
                        </span>
                        <button
                            onClick={() => setActiveSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                            disabled={activeSlideIdx >= slides.length - 1}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stage + Thumbnail Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Thumbnail Drawer */}
                <div className="w-56 sm:w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto p-3 space-y-3 flex-shrink-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Danh sách Slide
                    </p>
                    {slides.map((s, idx) => {
                        const isActive = idx === activeSlideIdx
                        return (
                            <div
                                key={s.id}
                                onClick={() => setActiveSlideIdx(idx)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-orange-500/10 border-orange-500 text-white shadow-md ring-1 ring-orange-500/40'
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                                    <span className="text-orange-400">Slide {s.id}</span>
                                    <Layout className="w-3 h-3 opacity-60" />
                                </div>
                                <p className="text-xs font-medium line-clamp-2 text-slate-200">
                                    {s.title}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Center Presentation Stage */}
                <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950">
                    <div
                        className="transition-transform duration-200 origin-center"
                        style={{ transform: `scale(${zoom / 100})` }}
                    >
                        {/* 16:9 Slide Canvas */}
                        <div className="w-[640px] h-[360px] sm:w-[800px] sm:h-[450px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
                            {/* Ambient Light Accent */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                            {/* Slide Header Title */}
                            <div className="relative z-10">
                                <div className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                                    Slide {currentSlide.id}
                                </div>
                                <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight drop-shadow-xs">
                                    {currentSlide.title}
                                </h2>
                            </div>

                            {/* Slide Body Content */}
                            <div className="relative z-10 flex-1 my-4 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                                {currentSlide.texts.length > 0 ? (
                                    currentSlide.texts.map((txt, tIdx) => (
                                        <div key={tIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-300">
                                            <span className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                                            <p className="leading-relaxed">{txt}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                        Nội dung trang Slide dạng hình ảnh / biểu đồ
                                    </div>
                                )}
                            </div>

                            {/* Slide Footer */}
                            <div className="relative z-10 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                                <span>HR Assistant Presentation</span>
                                <span>Slide {currentSlide.id} / {slides.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PptxViewer
