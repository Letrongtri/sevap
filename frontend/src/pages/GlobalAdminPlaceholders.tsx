interface PlaceholderProps {
    title: string
    description: string
}

function AdminPagePlaceholder({ title, description }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold animate-pulse">
                GA
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
                {title}
            </h1>
            <p className="text-text-secondary max-w-md">{description}</p>
        </div>
    )
}

export function GlobalAdminTenants() {
    return (
        <AdminPagePlaceholder
            title="Tenants Management"
            description="Manage all system-wide organization registry accounts, edit domains, modify usage caps, and view subscription states."
        />
    )
}

export function GlobalAdminPermissions() {
    return (
        <AdminPagePlaceholder
            title="Global Permissions Master"
            description="Control administrative policies, authorize platform actions, and manage security parameters for client operations."
        />
    )
}

export function GlobalAdminInfrastructure() {
    return (
        <AdminPagePlaceholder
            title="AI Models & Infrastructure"
            description="Monitor model deployments, set system inference endpoints (such as local Ollama engine parameters), and check VRAM allocations."
        />
    )
}

export function GlobalAdminLogs() {
    return (
        <AdminPagePlaceholder
            title="System Logs"
            description="Access global administrative event trails, audit logs, chronologies, and standard output log messages."
        />
    )
}
