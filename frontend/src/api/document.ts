import axiosClient from './axios'
import type {
    Document,
    DocumentUploadPayload,
    DocumentPaginatedResponse,
    DocumentQuery,
    DocumentUpdatePayload,
} from '../types/document'
import type { ID } from '../types/common'

/** Lấy danh sách tất cả tài liệu */
export const fetchDocuments = async (
    query: DocumentQuery
): Promise<DocumentPaginatedResponse> => {
    const res = await axiosClient.get('/documents', {
        params: {
            query: query.query,
            department_id: query.department_id,
            access_level: query.access_level,
            effective_date: query.effective_date,
            role_id: query.role_id,
            job_title_id: query.job_title_id,
            user_id: query.user_id,
            page: query.page,
            limit: query.limit,
        },
    })
    return res.data
}

/** Lấy thông tin tài liệu theo ID */
export const fetchDocumentById = async (id: ID): Promise<Document> => {
    const res = await axiosClient.get(`/documents/${id}`)
    return res.data
}

/** Upload tài liệu mới — gửi policies dưới dạng JSON string qua FormData */
export const uploadDocument = async (
    payload: DocumentUploadPayload
): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', payload.file)
    formData.append('access_level', payload.access_level)

    if (payload.title) {
        formData.append('title', payload.title)
    }
    if (payload.category) {
        formData.append('category', payload.category)
    }
    if (payload.effective_date) {
        formData.append('effective_date', payload.effective_date)
    }
    // policies: serialize thành JSON string (backend nhận Form field `policies`)
    if (payload.policies && payload.policies.length > 0) {
        formData.append('policies', JSON.stringify(payload.policies))
    }
    if (payload.target_user_ids && payload.target_user_ids.length > 0) {
        payload.target_user_ids.forEach((id) => {
            formData.append('target_user_ids', id.toString())
        })
    }

    const res = await axiosClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
}

/** Cập nhật thông tin tài liệu — gửi policies dưới dạng JSON body */
export const updateDocument = async (
    id: ID,
    payload: DocumentUpdatePayload
): Promise<Document> => {
    const res = await axiosClient.put(`/documents/${id}`, payload)
    return res.data
}

/** Xoá tài liệu */
export const deleteDocument = async (id: ID): Promise<Document> => {
    const res = await axiosClient.delete(`/documents/${id}`)
    return res.data
}

/** Tải xuống hoặc xem tài liệu (.docx) */
export const downloadDocumentFile = async (
    id: ID,
    fileName: string
): Promise<void> => {
    const res = await axiosClient.get(`/documents/${id}/file`, {
        responseType: 'blob',
    })

    const url = URL.createObjectURL(res.data)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/** Tải file blob của tài liệu để xem trước */
export const fetchDocumentFileBlob = async (id: ID): Promise<Blob> => {
    const res = await axiosClient.get(`/documents/${id}/file`, {
        responseType: 'blob',
    })
    return res.data
}
