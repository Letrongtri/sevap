import { RegisterForm } from '../components/auth/register/RegisterForm'

export const RegisterPage = () => {
    return (
        <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Branding (visible on lg screens, nicely styled on smaller) */}
            <div className="w-full lg:w-[44%] flex flex-col justify-center px-8 py-12 lg:p-16 xl:p-24 lg:pr-4 xl:pr-6 lg:h-full overflow-y-auto lg:overflow-hidden flex-shrink-0">
                <div className="max-w-md mx-auto lg:mx-0 flex flex-col gap-6">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <img
                            src="/app-logo.svg"
                            alt="SEVAP Logo"
                            className="w-16 h-16 rounded-2xl shadow-sm"
                        />
                    </div>

                    {/* Brand Name */}
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold text-text-primary tracking-widest">
                            SEVAP
                        </h1>
                        <div className="text-3xl lg:text-5xl font-black text-text-primary tracking-tight leading-[1.15] whitespace-nowrap">
                            Vượt qua mọi giới hạn
                        </div>
                        <p className="text-sm lg:text-base text-text-muted leading-relaxed mt-4 max-w-sm">
                            Nền tảng Trợ lý ảo Doanh nghiệp bảo mật cao, giúp
                            doanh nghiệp xây dựng môi trường làm việc thông
                            minh, an toàn và tự động hóa.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Registration Form Card */}
            <div className="w-full lg:w-[54%] bg-bg flex items-center justify-center p-4 sm:p-6 lg:p-12 xl:p-16 lg:h-full overflow-hidden">
                <RegisterForm />
            </div>
        </div>
    )
}

export default RegisterPage
