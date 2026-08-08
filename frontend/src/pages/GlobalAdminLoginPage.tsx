import React, { useState } from 'react'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

/* ============================================================
   GlobalAdminLoginPage — Zone 4 entry point
   Separate login for system-level global admins.
   No tenant domain required (uses system.sevap.com internally).
   ============================================================ */

export default function GlobalAdminLoginPage() {
    usePageTitle('Đăng nhập System Admin')
    const { loginGlobalAdmin, isLoading, error } = useAuth()
    const [values, setValues] = useState({ employeeCode: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{
        employeeCode?: string
        password?: string
    }>({})

    const validate = (): boolean => {
        const errs: typeof fieldErrors = {}
        if (!values.employeeCode.trim())
            errs.employeeCode = 'Vui lòng nhập mã nhân viên.'
        if (!values.password) errs.password = 'Vui lòng nhập mật khẩu.'
        setFieldErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setValues((prev) => ({ ...prev, [name]: value }))
        if (fieldErrors[name as keyof typeof fieldErrors]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validate()) return
        loginGlobalAdmin({
            employeeCode: values.employeeCode,
            password: values.password,
        })
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-md">
                <div className="bg-surface rounded-2xl shadow-xl shadow-border/60 border border-border overflow-hidden">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border flex flex-col items-center gap-2">
                        <img
                            src="/app-logo.svg"
                            alt="Logo"
                            className="w-15 h-15 rounded-xl flex-shrink-0"
                        />
                        <div className="flex flex-col items-center mt-1 text-center">
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                                Quản lý hệ thống
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                Khu vực dành riêng cho quản trị viên hệ thống
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="px-8 py-7 space-y-5"
                    >
                        {/* API error */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 bg-error-bg border border-error-border rounded-xl px-4 py-3"
                            >
                                <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-error-text font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Employee code */}
                        <Input
                            id="ga-employee-code"
                            name="employeeCode"
                            type="text"
                            label="Mã nhân viên"
                            placeholder="Nhập mã nhân viên"
                            autoComplete="username"
                            value={values.employeeCode}
                            onChange={handleChange}
                            leftIcon={<User className="w-4 h-4" />}
                            errorText={fieldErrors.employeeCode}
                            disabled={isLoading}
                        />

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="ga-password"
                                className="block text-sm font-semibold text-text-secondary"
                            >
                                Mật khẩu
                            </label>
                            <Input
                                id="ga-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                autoComplete="current-password"
                                value={values.password}
                                onChange={handleChange}
                                leftIcon={<Lock className="w-4 h-4" />}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((p) => !p)
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hiện mật khẩu'
                                                : 'Ẩn mật khẩu'
                                        }
                                        className="text-text-placeholder hover:text-text-muted transition-colors duration-150 p-0.5"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                }
                                errorText={fieldErrors.password}
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            id="ga-login-submit-btn"
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            isLoading={isLoading}
                            loadingText="Đang xác thực..."
                        >
                            Truy cập trang quản trị
                        </Button>
                    </form>

                    {/* Security notice */}
                    <div className="px-8 pb-6 text-center">
                        <p className="text-xs text-text-placeholder">
                            Tất cả các nỗ lực truy cập đều được ghi lại và giám
                            sát.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
