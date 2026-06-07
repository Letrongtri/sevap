import InputBox from '../components/home/InputBox'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
    const user = useAuthStore((s) => s.user)

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Chào buổi sáng'
        if (hour < 18) return 'Chào buổi chiều'
        return 'Chào buổi tối'
    }

    console.log(user)

    return (
        <div className="flex flex-col h-full items-center justify-center px-6">
            {/* ── Greeting ─────────────────────────────────────────── */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">
                    {user?.fullName
                        ? `${greeting()}, ${user.fullName.split(' ').pop()}!`
                        : 'Hôm nay bạn cần hỗ trợ gì?'}
                </h1>
                {user?.fullName && (
                    <p className="mt-2 text-base text-text-secondary">
                        Hôm nay bạn cần hỗ trợ gì?
                    </p>
                )}
            </div>

            {/* ── Input box ────────────────────────────────────────── */}
            <InputBox />
        </div>
    )
}
