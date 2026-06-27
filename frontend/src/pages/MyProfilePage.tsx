import Header from '../components/ui/Header'
import ProfileInfoCard from '../components/profile/ProfileInfoCard'
import SecurityCard from '../components/profile/SecurityCard'
import { useMyProfile } from '../hooks/useUsers'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from 'sonner'

/* ============================================================
   MyProfilePage — orchestrator page
   Renders the two profile cards.
   Toast notifications are handled by sonner (mounted in main.tsx).
   ============================================================ */

const MyProfilePage = () => {
    const { data: user, isLoading, error } = useMyProfile()

    const handleSaveSuccess = () => {
        toast.success('Profile updated', {
            description: 'Your changes have been saved successfully.',
        })
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Loading profile...
                </p>
            </div>
        )
    }

    if (error) {
        toast.error('Failed to load profile', {
            description: error.message,
        })
        return (
            <div className="min-h-full flex flex-col gap-6">
                <div className="flex-shrink-0">
                    <Header title="My Profile" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-full flex flex-col gap-6">
            {/* Page header */}
            <div className="flex-shrink-0">
                <Header title="My Profile" />
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
