import { usePromptTemplateStore } from '../../store/promptTemplateStore'
import { X } from 'lucide-react'
import { usePromptTemplates } from '../../hooks/usePromptTemplate'
import DetailPromptTemplateForm from './DetailPromptTemplateForm'

const PromptTemplateDetail = () => {
    const activePromptTemplateId = usePromptTemplateStore(
        (s) => s.activePromptTemplateId
    )
    const setActivePromptTemplateId = usePromptTemplateStore(
        (s) => s.setActivePromptTemplateId
    )
    const isAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.isAddingPromptTemplate
    )
    const setIsAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.setIsAddingPromptTemplate
    )

    const { prompt_templates } = usePromptTemplates()
    const selectedPrompt =
        prompt_templates.find((p) => p.id === activePromptTemplateId) || null

    const handleCloseCard = () => {
        setActivePromptTemplateId(null)
        setIsAddingPromptTemplate(false)
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Header section with Close X */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                <button
                    onClick={handleCloseCard}
                    title="Đóng bảng chi tiết"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingPromptTemplate
                        ? 'Thêm prompt mới'
                        : selectedPrompt
                          ? 'Thông tin prompt'
                          : ''}
                </h2>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {(isAddingPromptTemplate || selectedPrompt) && (
                    <DetailPromptTemplateForm
                        key={selectedPrompt?.id ?? 'new-prompt'}
                        selectedPrompt={selectedPrompt}
                        onCloseCard={handleCloseCard}
                    />
                )}
            </div>
        </div>
    )
}

export default PromptTemplateDetail
