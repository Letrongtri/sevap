import Header from '../components/ui/Header'
import ProfileInfoCard from '../components/profile/ProfileInfoCard'
import SecurityCard from '../components/profile/SecurityCard'
import { useMyProfile } from '../hooks/useUsers'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { usePageTitle } from '../hooks/usePageTitle'

/* ============================================================
   MyProfilePage — orchestrator page
   Renders the two profile cards.
   Toast notifications are handled by sonner (mounted in main.tsx).
   ============================================================ */

const MyProfilePage = () => {
    usePageTitle('Hồ sơ cá nhân')
    const { data: user, isLoading, error } = useMyProfile()

    const handleSaveSuccess = () => {
        toast.success('Hồ sơ cá nhân đã được cập nhật', {
            description: 'Các thay đổi của bạn đã được lưu thành công.',
        })
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải hồ sơ...
                </p>
            </div>
        )
    }

    if (error) {
        toast.error('Tải hồ sơ thất bại', {
            description: error.message,
        })
        return (
            <div className="min-h-full flex flex-col gap-6">
                <div className="flex-shrink-0">
                    <Header title="Hồ sơ cá nhân" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-full flex flex-col gap-6">
            {/* Page header */}
            <div className="flex-shrink-0">
                <Header title="Hồ sơ cá nhân" />
            </div>

            {/* Card 1 — Profile info */}
            <ProfileInfoCard user={user!} onSaveSuccess={handleSaveSuccess} />

            {/* Card 2 — Security & Authentication */}
            <SecurityCard />

            {/* Bottom spacer */}
            <div className="h-2" />
        </div>
    )
}

export default MyProfilePage
