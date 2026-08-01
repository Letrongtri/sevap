import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { CompanyInfoSection } from './CompanyInfoSection'
import { AdminInfoSection } from './AdminInfoSection'
import { Button } from '../../ui/Button'
import { useRegisterTenant } from '../../../hooks/useTenant'
import type { AddTenantPayload } from '../../../types/tenant'

export const RegisterForm = () => {
    const navigate = useNavigate()
    const {
        mutate: register,
        isPending: isLoading,
        error: apiError,
    } = useRegisterTenant()

    const [values, setValues] = useState<AddTenantPayload>({
        company_name: '',
        tenant_domain: '',
        company_email: '',
        company_phone: '',
        company_address: '',
        company_description: '',
        admin_employee_code: '',
        admin_full_name: '',
        admin_email: '',
        admin_password: '',
    })

    const [errors, setErrors] = useState<
        Partial<Record<keyof AddTenantPayload, string>>
    >({})
    const [isSuccess, setIsSuccess] = useState(false)
    const [registeredDomain, setRegisteredDomain] = useState('')

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }))
        // Clear specific field error when user starts typing
        if (errors[name as keyof AddTenantPayload]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    const validate = (): boolean => {
        const tempErrors: Partial<Record<keyof AddTenantPayload, string>> = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const domainRegex = /^[a-z0-9-]+$/
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

        // Company validations
        if (!values.company_name.trim()) {
            tempErrors.company_name = 'Vui lòng nhập tên doanh nghiệp.'
        }

        if (!values.tenant_domain.trim()) {
            tempErrors.tenant_domain = 'Vui lòng nhập tên miền doanh nghiệp.'
        } else if (!domainRegex.test(values.tenant_domain)) {
            tempErrors.tenant_domain =
                'Tên miền chỉ được chứa chữ cái viết thường, chữ số và dấu gạch ngang.'
        }

        if (!values.company_email.trim()) {
            tempErrors.company_email = 'Vui lòng nhập email liên hệ.'
        } else if (!emailRegex.test(values.company_email)) {
            tempErrors.company_email = 'Vui lòng nhập địa chỉ email hợp lệ.'
        }

        // Admin validations
        if (!values.admin_employee_code.trim()) {
            tempErrors.admin_employee_code = 'Vui lòng nhập mã nhân viên quản trị.'
        }

        if (!values.admin_full_name.trim()) {
            tempErrors.admin_full_name = 'Vui lòng nhập họ và tên quản trị viên.'
        }

        if (!values.admin_email?.trim()) {
            tempErrors.admin_email = 'Vui lòng nhập email quản trị viên.'
        } else if (!emailRegex.test(values.admin_email)) {
            tempErrors.admin_email = 'Vui lòng nhập địa chỉ email hợp lệ.'
        }

        if (!values.admin_password) {
            tempErrors.admin_password = 'Vui lòng nhập mật khẩu.'
        } else if (!passwordRegex.test(values.admin_password)) {
            tempErrors.admin_password =
                'Mật khẩu phải đáp ứng các yêu cầu bảo mật bên dưới.'
        }

        setErrors(tempErrors)
        return Object.keys(tempErrors).length === 0
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validate()) {
            // Scroll to the first error
            const firstErrorField = Object.keys(errors)[0]
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField)
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        // Call the mutation hook
        register(values, {
            onSuccess: (data) => {
                setRegisteredDomain(data.tenant_domain)
                setIsSuccess(true)
            },
        })
    }

    if (isSuccess) {
        return (
            <div className="bg-surface rounded-2xl shadow-xl shadow-border/60 border border-border p-8 flex flex-col items-center text-center space-y-6 max-w-md w-full animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-success-bg border border-success-border flex items-center justify-center text-success">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-text-primary">
                        Đăng ký thành công!
                    </h2>
                    <p className="text-sm text-text-muted">
                        Tổ chức/Doanh nghiệp của bạn đã được khởi tạo thành công.
                    </p>
                </div>

                <div className="bg-bg rounded-xl p-4 w-full text-left border border-border/40">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">
                        Liên kết không gian làm việc
                    </p>
                    <p className="text-sm font-semibold text-text-primary break-all">
                        {registeredDomain}
                    </p>
                </div>

                <Button
                    onClick={() => navigate({ to: '/login' })}
                    variant="primary"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                    Đăng nhập vào Hệ thống
                </Button>
            </div>
        )
    }

    // Map any React Query error to string
    const getErrorMessage = () => {
        if (!apiError) return null
        const responseData = (apiError as any).response?.data
        if (responseData && typeof responseData.detail === 'string') {
            return responseData.detail
        }
        if (responseData && typeof responseData.message === 'string') {
            return responseData.message
        }
        return 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng kiểm tra lại thông tin và thử lại.'
    }

    return (
        <div className="bg-surface rounded-2xl shadow-xl shadow-border/60 border border-border overflow-hidden w-full max-w-2xl flex flex-col h-full max-h-[85vh] lg:max-h-[90vh]">
            {/* Form Header */}
            <div className="px-8 pt-8 pb-6 border-b border-border flex flex-col gap-1.5 flex-shrink-0">
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                    Đăng ký Doanh nghiệp
                </h2>
                <p className="text-sm text-text-muted">
                    Thiết lập không gian làm việc mới cho công ty của bạn.
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
                {/* Scrollable Form Fields */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                    {/* Global API error */}
                    {apiError && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 bg-error-bg border border-error-border rounded-xl px-4 py-3 animate-fade-in-down"
                        >
                            <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-error-text font-medium">
                                {getErrorMessage()}
                            </p>
                        </div>
                    )}

                    {/* Company Information Section */}
                    <CompanyInfoSection
                        values={values}
                        errors={errors as any}
                        disabled={isLoading}
                        onChange={handleChange}
                    />

                    {/* Separator */}
                    <hr className="border-border/60" />

                    {/* Administrator Information Section */}
                    <AdminInfoSection
                        values={values}
                        errors={errors as any}
                        disabled={isLoading}
                        onChange={handleChange}
                    />

                    {/* Fixed Actions Footer */}
                    <div className="pt-6 w-full flex flex-col items-center">
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="w-full min-w-[160px]"
                            isLoading={isLoading}
                            loadingText="Đang khởi tạo..."
                        >
                            Hoàn tất Đăng ký
                        </Button>
                    </div>

                    {/* Link to Login */}
                    <div className="text-center pt-2 border-t border-border">
                        <p className="text-sm text-text-muted">
                            Đã có tổ chức/doanh nghiệp?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
                            >
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default RegisterForm
