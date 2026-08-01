import { LoginForm } from '../components/auth/LoginForm'
import type { LoginCredentials } from '../types/auth'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

export default function LoginPage() {
    usePageTitle('Đăng nhập')
    const { login, isLoading, error } = useAuth()

    const handleSubmit = (credentials: LoginCredentials) => {
        login(credentials)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-md">
                <LoginForm
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    )
}
