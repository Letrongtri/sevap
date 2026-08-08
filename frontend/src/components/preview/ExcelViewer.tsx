import React, { useEffect, useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { AlertCircle, Loader2, Search, Table, FileSpreadsheet } from 'lucide-react'

interface ExcelViewerProps {
    file: File | Blob | ArrayBuffer
    zoom?: number
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ file, zoom = 100 }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
    const [activeSheet, setActiveSheet] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')

    useEffect(() => {
        const loadExcel = async () => {
            setLoading(true)
            setError(null)
            try {
                let buffer: ArrayBuffer
                if (file instanceof ArrayBuffer) {
                    buffer = file
                } else if (file instanceof Blob) {
                    buffer = await file.arrayBuffer()
                } else {
                    throw new Error('Dữ liệu file Excel không hợp lệ')
                }

                const wb = XLSX.read(buffer, { type: 'array', cellDates: true, cellStyles: true })
                setWorkbook(wb)
                if (wb.SheetNames.length > 0) {
                    setActiveSheet(wb.SheetNames[0])
                }
                setLoading(false)
            } catch (err: any) {
                console.error('Excel parse error:', err)
                setError(err.message || 'Không thể đọc nội dung tệp Excel')
                setLoading(false)
            }
        }

        loadExcel()
    }, [file])

    // Convert active sheet to 2D array matrix
    const sheetMatrix = useMemo(() => {
        if (!workbook || !activeSheet || !workbook.Sheets[activeSheet]) return []
        const sheet = workbook.Sheets[activeSheet]
        const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })
        return data
    }, [workbook, activeSheet])

    // Generate Excel column names (A, B, C... Z, AA, AB...)
    const getColumnLabel = (index: number): string => {
        let label = ''
        let n = index
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label
            n = Math.floor(n / 26) - 1
        }
        return label
    }

    // Determine max columns length across rows
    const maxCols = useMemo(() => {
        let max = 0
        sheetMatrix.forEach((row) => {
            if (Array.isArray(row) && row.length > max) {
                max = row.length
            }
        })
        return Math.max(max, 5) // At least 5 columns
    }, [sheetMatrix])

    // Highlight matching query
    const isMatched = (cellVal: any) => {
        if (!searchQuery.trim()) return false
        return String(cellVal).toLowerCase().includes(searchQuery.toLowerCase().trim())
    }

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">Đang xử lý bảng tính Excel (.xlsx)...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 mb-2 text-red-500" />
                    <h4 className="font-semibold text-base mb-1">Lỗi đọc file Excel</h4>
                    <p className="text-xs text-red-600 mb-4">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            {/* Excel Sub-header toolbar: Search & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Sheet: <strong className="text-emerald-700">{activeSheet}</strong></span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{sheetMatrix.length} hàng x {maxCols} cột</span>
                </div>

                <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm ô dữ liệu trong Sheet..."
                        className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>

            {/* Excel Grid container */}
            <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
                <div
                    className="origin-top-left transition-transform duration-150 inline-block min-w-full"
                    style={{ transform: `scale(${zoom / 100})` }}
                >
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="border-collapse w-full text-xs select-text">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 border-b border-slate-300">
                                    <th className="w-10 py-1.5 px-2 text-center border-r border-slate-300 bg-slate-200 font-medium select-none">
                                        #
                                    </th>
                                    {Array.from({ length: maxCols }).map((_, colIdx) => (
                                        <th
                                            key={colIdx}
                                            className="px-3 py-1.5 border-r border-slate-300 text-center font-semibold bg-slate-100 text-slate-700 min-w-[100px] select-none"
                                        >
                                            {getColumnLabel(colIdx)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sheetMatrix.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={maxCols + 1}
                                            className="text-center py-8 text-slate-400 italic"
                                        >
                                            Trang tính rỗng
                                        </td>
                                    </tr>
                                ) : (
                                    sheetMatrix.map((row, rowIdx) => (
                                        <tr
                                            key={rowIdx}
                                            className="hover:bg-emerald-50/40 border-b border-slate-200 transition-colors"
                                        >
                                            <td className="py-1 px-2 text-center font-semibold bg-slate-100 border-r border-slate-300 text-slate-500 select-none text-[11px]">
                                                {rowIdx + 1}
                                            </td>
                                            {Array.from({ length: maxCols }).map((_, colIdx) => {
                                                const cellVal = row && row[colIdx] !== undefined ? row[colIdx] : ''
                                                const matched = isMatched(cellVal)
                                                return (
                                                    <td
                                                        key={colIdx}
                                                        className={`px-3 py-1.5 border-r border-slate-200 text-slate-800 break-words max-w-xs ${
                                                            matched ? 'bg-amber-200 text-slate-900 font-semibold ring-2 ring-amber-400' : ''
                                                        }`}
                                                    >
                                                        {cellVal !== null && cellVal !== undefined ? String(cellVal) : ''}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Navigation Tabs */}
            {workbook && workbook.SheetNames.length > 1 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 border-t border-slate-300 overflow-x-auto select-none">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase mr-2 flex-shrink-0">
                        Danh sách Sheets ({workbook.SheetNames.length}):
                    </span>
                    {workbook.SheetNames.map((name) => {
                        const isActive = name === activeSheet
                        return (
                            <button
                                key={name}
                                onClick={() => setActiveSheet(name)}
                                className={`px-3 py-1 text-xs font-medium rounded-t-md transition-all cursor-pointer flex-shrink-0 border ${
                                    isActive
                                        ? 'bg-white text-emerald-700 border-slate-300 border-b-white shadow-xs font-semibold'
                                        : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-50'
                                }`}
                            >
                                <Table className="w-3 h-3 inline-block mr-1 opacity-70" />
                                {name}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ExcelViewer
