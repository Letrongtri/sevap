import type { Permission } from '../../types/permission'

interface PermissionsMatrixProps {
    permissionsData?: Permission[]
    editPermissionIds: number[]
    onTogglePermission: (permissionId: number) => void
}

const ACTIONS = [
    { key: 'read', label: 'READ' },
    { key: 'write', label: 'WRITE' },
    { key: 'delete', label: 'DELETE' },
    { key: 'manage', label: 'MANAGE' },
    { key: 'execute', label: 'EXECUTE' },
]

const PermissionsMatrix = ({
    permissionsData,
    editPermissionIds,
    onTogglePermission,
}: PermissionsMatrixProps) => {
    // Dynamic list of unique resources, sorted alphabetically
    const resources = Array.from(
        new Set(permissionsData?.map((p) => p.resource) ?? [])
    ).sort()

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-secondary">
                Permissions Matrix
            </label>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
                <table className="min-w-full table-fixed border-collapse text-xs">
                    <thead>
                        <tr className="bg-surface-raised border-b border-border">
                            {/* Resource Column: 25% width */}
                            <th className="border-r border-border p-3 font-semibold text-text-secondary text-left w-[25%]">
                                Resource
                            </th>
                            {/* Action Columns: Each 15% width, total 75%, headings centered */}
                            {ACTIONS.map((act) => (
                                <th
                                    key={act.key}
                                    className="border-r last:border-r-0 border-border p-3 font-bold text-text-primary text-center tracking-wider w-[15%]"
                                >
                                    {act.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((res) => (
                            <tr
                                key={res}
                                className="border-b last:border-b-0 border-border hover:bg-surface-raised/40 transition-colors"
                            >
                                <td className="border-r border-border p-3 font-medium text-text-secondary text-left capitalize">
                                    {res}
                                </td>
                                {ACTIONS.map((act) => {
                                    const perm = permissionsData?.find(
                                        (p) =>
                                            p.resource === res &&
                                            p.action === act.key
                                    )
                                    if (!perm) {
                                        return (
                                            <td
                                                key={act.key}
                                                className="border-r last:border-r-0 border-border p-3 bg-bg/30 text-text-disabled text-center select-none"
                                            >
                                                -
                                            </td>
                                        )
                                    }
                                    const isSelected =
                                        editPermissionIds.includes(
                                            perm.id as number
                                        )
                                    return (
                                        <td
                                            key={act.key}
                                            onClick={() =>
                                                onTogglePermission(
                                                    perm.id as number
                                                )
                                            }
                                            className={[
                                                'border-r last:border-r-0 border-border p-3 cursor-pointer text-center select-none transition-all duration-150',
                                                isSelected
                                                    ? 'bg-primary-light text-primary font-bold hover:bg-primary-light/80'
                                                    : 'text-text-placeholder hover:bg-surface-raised',
                                            ].join(' ')}
                                            title={perm.description}
                                        >
                                            <div className="flex items-center justify-center h-full w-full">
                                                {isSelected ? (
                                                    <span className="text-sm text-primary font-extrabold transition-all scale-110">
                                                        X
                                                    </span>
                                                ) : (
                                                    <span className="text-sm opacity-0 hover:opacity-30 transition-opacity">
                                                        X
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-text-muted mt-1">
                * Click on cells with available permissions (hovering shows
                placeholder 'X') to toggle.
            </p>
        </div>
    )
}

export default PermissionsMatrix
