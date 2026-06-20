import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DomainInput } from '../ui/DomainInput'
import type { LoginCredentials } from '../../types/auth'

interface LoginFormProps {
    isLoading?: boolean
    error?: string | null
    onSubmit: (credentials: LoginCredentials) => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
    isLoading = false,
    error,
    onSubmit,
}) => {
    const [values, setValues] = useState<LoginCredentials>({
        tenantDomain: '',
        employeeCode: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Partial<LoginCredentials>>(
        {}
    )

    const validate = (): boolean => {
        const errs: Partial<Record<keyof LoginCredentials, string>> = {}
        if (!values.tenantDomain.trim())
            errs.tenantDomain = 'Tenant domain is required.'
        if (!values.employeeCode.trim())
            errs.employeeCode = 'Employee code is required.'
        if (!values.password) errs.password = 'Password is required.'
        setFieldErrors(errs as Partial<LoginCredentials>)
        return Object.keys(errs).length === 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
        // Clear field error on change
        if (fieldErrors[name as keyof LoginCredentials]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validate()) return
        onSubmit(values)
    }

    return (
        <div className="bg-surface rounded-2xl shadow-xl shadow-border/60 border border-border overflow-hidden w-full max-w-md">
            {/* ---- Card Header ---- */}
            <div className="px-8 pt-8 pb-6 border-b border-border justify-center items-center flex flex-col gap-2">
                <img
                    src="/app-logo.svg"
                    alt="Logo"
                    className="w-15 h-15 rounded-xl flex-shrink-0"
                />
                <div className="flex flex-col items-center mt-1">
                    <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                        Welcome back
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        Sign in to access your workspace
                    </p>
                </div>
            </div>

            {/* ---- Form ---- */}
            <form
                onSubmit={handleSubmit}
                noValidate
                className="px-8 py-7 space-y-5"
            >
                {/* Global API error */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 bg-error-bg border border-error-border rounded-xl px-4 py-3 animate-fade-in-down"
                    >
                        <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-error-text font-medium">
                            {error}
                        </p>
                    </div>
                )}

                {/* Tenant domain */}
                <DomainInput
                    id="tenantDomain"
                    name="tenantDomain"
                    label="Tenant Domain"
                    placeholder="company"
                    value={values.tenantDomain}
                    onChange={handleChange}
                    errorText={fieldErrors.tenantDomain as string | undefined}
                    disabled={isLoading}
                    required
                />

                {/* Employee code */}
                <Input
                    id="employeeCode"
                    name="employeeCode"
                    type="text"
                    label="Employee Code"
                    placeholder="Enter your employee code"
                    autoComplete="employeeCode"
                    value={values.employeeCode}
                    onChange={handleChange}
                    leftIcon={<User className="w-4 h-4" />}
                    errorText={fieldErrors.employeeCode as string | undefined}
                    disabled={isLoading}
                />

                {/* Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-text-secondary"
                    >
                        Password
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={values.password}
                        onChange={handleChange}
                        leftIcon={<Lock className="w-4 h-4" />}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
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
                        errorText={fieldErrors.password as string | undefined}
                        disabled={isLoading}
                    />
                </div>

                {/* Submit */}
                <Button
                    id="login-submit-btn"
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Authenticating..."
                >
                    Sign in to Platform
                </Button>

                {/* Link to Registration */}
                <div className="text-center pt-2">
                    <p className="text-sm text-text-muted">
                        Don't have an organization?{' '}
                        <Link
                            to="/register"
                            className="font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
                        >
                            Register now
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}

export default LoginForm
