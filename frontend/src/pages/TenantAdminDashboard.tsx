import { LayoutDashboard } from 'lucide-react'
import TenantInfoCard from '../components/tenantAdmin/TenantInfoCard'
import StatCardsRow from '../components/tenantAdmin/StatCardsRow'
import QueryFrequencyChart from '../components/tenantAdmin/QueryFrequencyChart'
import DocDistributionChart from '../components/tenantAdmin/DocDistributionChart'
import Header from '../components/ui/Header'

export default function TenantAdminDashboard() {
    return (
        <div className="space-y-4 pb-10 max-w-[1600px] mx-auto">
            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex-shrink-0">
                <Header
                    title="Dashboard"
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    isAdding={false}
                    onAdd={() => {}}
                    btnTitle="Refresh"
                />
            </div>

            {/* ── SECTION 1: Enterprise Info Card ─────────────────────── */}
            <TenantInfoCard />

            {/* ── SECTION 2: KPI Stat Cards ───────────────────────────── */}
            <StatCardsRow />

            {/* ── SECTION 3: Charts Row ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Query frequency chart takes 2/3 width */}
                <div className="lg:col-span-2">
                    <QueryFrequencyChart />
                </div>

                {/* PAR Gate donut chart takes 1/3 */}
                <div>
                    <DocDistributionChart />
                </div>
            </div>
        </div>
    )
}
