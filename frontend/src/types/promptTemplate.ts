import type { ID, PaginatedResponse, Timestamp } from './common'

export const PROMPT_TEMPLATE_TYPE_OPTIONS = {
    ASSISTANT_NAME: 'assistant_name',
    ASSISTANT_CAPABILITIES: 'assistant_capabilities',
    RESPONSE_BEHAVIORAL: 'response_behavioral',
    LANGUAGE: 'language',
    RESPONSE_TONE: 'response_tone',
    RESPONSE_FORMATTING: 'response_formatting',
    RESPONSE_CITATION: 'response_citation',
    FALLBACK_RESPONSE: 'fallback_response',
    SECURITY_KILL_SWITCH_RESPONSE: 'security_kill_switch_response',
} as const

export const PROMPT_TYPE_LABELS: Record<string, string> = {
    assistant_name: 'Tên trợ lý',
    assistant_capabilities: 'Năng lực trợ lý',
    response_behavioral: 'Hành vi phản hồi',
    language: 'Ngôn ngữ phản hồi',
    response_tone: 'Giọng điệu phản hồi',
    response_formatting: 'Định dạng phản hồi',
    response_citation: 'Trích dẫn tài liệu',
    fallback_response: 'Phản hồi khi không tìm thấy thông tin',
    security_kill_switch_response: 'Phản hồi khi vi phạm chính sách an toàn',
}

export const PROMPT_TEMPLATE_TYPE_SELECT_OPTIONS = Object.entries(
    PROMPT_TEMPLATE_TYPE_OPTIONS
).map(([, value]) => ({
    label: PROMPT_TYPE_LABELS[value] || value,
    value: value,
}))

export interface PromptTemplate {
    id: ID
    tenant_id: ID
    user_id?: ID | null
    user_name?: string | null
    user_employee_code?: string | null
    name: string
    type: string
    content: string
    description: string | null
    is_active: boolean
    created_at: Timestamp
    updated_at: Timestamp
}

export interface AddPromptTemplatePayload {
    name: string
    description?: string | null
    type: string
    content?: string | null
}

export interface UpdatePromptTemplatePayload {
    id: ID
    name?: string | null
    description?: string | null
    type: string | null
    content?: string | null
}

export interface PromptTemplatePaginatedResponse {
    prompt_templates: PromptTemplate[]
    pagination: PaginatedResponse
}

export interface PromptTemplateState {
    isAddingPromptTemplate: boolean
    activePromptTemplateId: ID | null
    query?: string | null
    type?: string | null
    is_active?: boolean | null
    page?: number | null
    limit?: number
}

export interface PromptTemplateClientActions {
    setIsAddingPromptTemplate: (isAddingPromptTemplate: boolean) => void
    setActivePromptTemplateId: (id: ID | null) => void
    setQuery: (query: string | null) => void
    setType: (type: string | null) => void
    setIsActive: (is_active: boolean | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActivePromptTemplate: () => void
}

export type PromptTemplateStore = PromptTemplateState &
    PromptTemplateClientActions
