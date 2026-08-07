import Header from '../components/ui/Header'
import { usePageTitle } from '../hooks/usePageTitle'
import { usePermission } from '../hooks/usePermission'
import { PERMISSIONS } from '../lib/permissions'
import { usePromptTemplateStore } from '../store/promptTemplateStore'
import PromptTemplateTable from '../components/promptTemplate/PromptTemplateTable'
import PromptTemplateDetail from '../components/promptTemplate/PromptTemplateDetail'

export default function PromptTemplatesPage() {
    usePageTitle('Quản lý prompts')
    const canCreate = usePermission(PERMISSIONS.PROMPT_TEMPLATES_CREATE)
    const activePromptTemplateId = usePromptTemplateStore(
        (s) => s.activePromptTemplateId
    )
    const isAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.isAddingPromptTemplate
    )
    const showDetail = activePromptTemplateId !== null || isAddingPromptTemplate
    const setIsAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.setIsAddingPromptTemplate
    )
    const setActivePromptTemplateId = usePromptTemplateStore(
        (s) => s.setActivePromptTemplateId
    )

    const handleStartAddPromptTemplate = () => {
        setActivePromptTemplateId(null)
        setIsAddingPromptTemplate(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Quản lý prompts"
                    isAdding={isAddingPromptTemplate}
                    onAdd={canCreate ? handleStartAddPromptTemplate : undefined}
                    btnTitle="Thêm prompt"
                />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <PromptTemplateTable />
                </div>

                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <PromptTemplateDetail
                            key={activePromptTemplateId || 'adding'}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
