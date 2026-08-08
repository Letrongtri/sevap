import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { ID } from '../../types/common'
import SearchableMultiSelect from '../ui/SearchableMultiSelect'
import type { PolicyGroupState } from '../../types/document'

interface PolicyGroupCardProps {
    group: PolicyGroupState
    index: number
    roleOptions: { value: ID; label: string }[]
    departmentOptions: { value: ID; label: string }[]
    jobTitleOptions: { value: ID; label: string }[]
    onUpdate: (id: string, patch: Partial<PolicyGroupState>) => void
    onRemove: (id: string) => void
    canRemove: boolean
}

const PolicyGroupCard: React.FC<PolicyGroupCardProps> = ({
    group,
    index,
    roleOptions,
    departmentOptions,
    jobTitleOptions,
    onUpdate,
    onRemove,
    canRemove,
}) => {
    const hasConditions =
        group.roleIds.length > 0 ||
        group.departmentIds.length > 0 ||
        group.jobTitleIds.length > 0

    return (
        <div className="border border-border/50 rounded-xl bg-white shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2.5 bg-surface-raised/60 cursor-pointer select-none"
                onClick={() =>
                    onUpdate(group.id, { expanded: !group.expanded })
                }
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                    </div>
                    <span className="text-xs font-semibold text-text-primary">
                        Policy Group {index + 1}
                    </span>
                    {!hasConditions && (
                        <span className="text-[10px] text-warning font-medium bg-warning/10 px-1.5 py-0.5 rounded-md">
                            Chưa có điều kiện
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {canRemove && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(group.id)
                            }}
                            className="p-1 rounded-lg text-text-placeholder hover:text-error hover:bg-error-bg/30 transition-colors"
                            title="Xóa policy group này"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {group.expanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-text-placeholder" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-text-placeholder" />
                    )}
                </div>
            </div>

            {/* Body */}
            {group.expanded && (
                <div className="p-3 space-y-3 border-t border-border/30 animate-fade-in">
                    <p className="text-[10px] text-text-placeholder leading-normal">
                        User phải thỏa{' '}
                        <strong className="text-text-secondary">tất cả</strong>{' '}
                        điều kiện trong group này mới được truy cập.
                    </p>

                    <SearchableMultiSelect
                        options={roleOptions}
                        value={group.roleIds}
                        onChange={(val) => onUpdate(group.id, { roleIds: val })}
                        placeholder="Chưa chọn vai trò"
                        label="Vai trò (Roles)"
                    />

                    <SearchableMultiSelect
                        options={departmentOptions}
                        value={group.departmentIds}
                        onChange={(val) =>
                            onUpdate(group.id, { departmentIds: val })
                        }
                        placeholder="Chưa chọn phòng ban"
                        label="Phòng ban (Departments)"
                    />

                    <SearchableMultiSelect
                        options={jobTitleOptions}
                        value={group.jobTitleIds}
                        onChange={(val) =>
                            onUpdate(group.id, { jobTitleIds: val })
                        }
                        placeholder="Chưa chọn chức danh"
                        label="Chức danh (Job Titles)"
                    />
                </div>
            )}
        </div>
    )
}

export default PolicyGroupCard
