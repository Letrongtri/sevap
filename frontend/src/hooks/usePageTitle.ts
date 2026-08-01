import { useEffect } from 'react'

/**
 * Custom hook to dynamically update title per page
 * @param title Page title (e.g. "Trang chủ")
 */
export function usePageTitle(title?: string) {
    useEffect(() => {
        const defaultTitle = 'SEVAP - Trợ lý ảo Doanh nghiệp'
        if (title) {
            document.title = `${title} - SEVAP`
        } else {
            document.title = defaultTitle
        }
    }, [title])
}
