import axiosClient from './axios'
import type {
    AddPromptTemplatePayload,
    PromptTemplate,
    PromptTemplatePaginatedResponse,
    UpdatePromptTemplatePayload,
} from '../types/promptTemplate'
import type { ID } from '../types/common'

export const fetchPromptTemplates = async (
    query?: string | null,
    type?: string | null,
    is_active?: boolean | null,
    page?: number | null,
    limit: number = 10
): Promise<PromptTemplatePaginatedResponse> => {
    const res = await axiosClient.get('/prompt-templates', {
        params: {
            query,
            type,
            is_active,
            page,
            limit,
        },
    })
    return res.data
}

export const fetchPromptTemplateById = async (
    id: ID
): Promise<PromptTemplate> => {
    const res = await axiosClient.get(`/prompt-templates/${id}`)
    return res.data
}

export const createPromptTemplate = async (
    payload: AddPromptTemplatePayload
): Promise<PromptTemplate> => {
    const res = await axiosClient.post('/prompt-templates', payload)
    return res.data
}

export const updatePromptTemplate = async (
    id: ID,
    payload: UpdatePromptTemplatePayload
): Promise<PromptTemplate> => {
    const res = await axiosClient.put(`/prompt-templates/${id}`, payload)
    return res.data
}

export const togglePromptTemplateStatus = async (
    id: ID
): Promise<PromptTemplate> => {
    const res = await axiosClient.patch(`/prompt-templates/${id}/toggle`)
    return res.data
}

export const deletePromptTemplate = async (id: ID): Promise<PromptTemplate> => {
    const res = await axiosClient.delete(`/prompt-templates/${id}`)
    return res.data
}
