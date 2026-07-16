// format DateTime to dd/mm/yyyy
export const formatDateTimeToDDMMYYYY = (dateTime: string): string => {
    const date = new Date(dateTime)
    return date.toLocaleDateString('vi-VN')
}

export const formatDateTimeToDDMMYYYYHHMMSS = (dateTime: string): string => {
    const date = new Date(dateTime)
    const formattedDate = date.toLocaleDateString('vi-VN')
    const formattedTime = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    return `${formattedDate} ${formattedTime}`
}

export function formatBytes(bytes: number | null | undefined, decimals = 2) {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
export function getShortFileType(mimeType: string | null | undefined): string {
    if (!mimeType) return 'DOCX'
    const clean = mimeType.toLowerCase()
    if (clean.includes('wordprocessingml') || clean.includes('msword'))
        return 'DOCX'
    if (clean.includes('pdf')) return 'PDF'
    if (clean.includes('spreadsheetml') || clean.includes('ms-excel'))
        return 'XLSX'
    const parts = clean.split('/')
    const ext = parts[parts.length - 1]
    return ext.toUpperCase()
}
