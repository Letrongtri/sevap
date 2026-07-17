import Header from '../components/ui/Header'

export default function TenantAdminDashboard() {
    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header title="Dashboard" />
            </div>
        </div>
    )
}
