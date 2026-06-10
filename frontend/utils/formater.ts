// format DateTime to dd/mm/yyyy
export const formatDateTimeToDDMMYYYY = (dateTime: string): string => {
    const date = new Date(dateTime)
    return date.toLocaleDateString('vi-VN')
}
