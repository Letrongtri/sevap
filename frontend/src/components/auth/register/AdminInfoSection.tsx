import React, { useState } from 'react'
import { ShieldCheck, Eye, EyeOff, Lock, User, Mail } from 'lucide-react'
import { Input } from '../../ui/Input'

interface AdminInfoSectionProps {
    values: {
        admin_employee_code: string | null
        admin_full_name: string | null
        admin_email: string | null
        admin_password: string | null
    }
    errors: {
        admin_employee_code?: string
        admin_full_name?: string
        admin_email?: string
        admin_password?: string
    }
    disabled?: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const AdminInfoSection: React.FC<AdminInfoSectionProps> = ({
    values,
    errors,
    disabled = false,
    onChange,
}) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase border-b border-border/40 pb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Administrator Information</span>
            </div>

            {/* Employee Code & Full Name (Side-by-Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    id="admin_employee_code"
                    name="admin_employee_code"
                    type="text"
                    label="Employee Code"
                    placeholder="e.g., ADM001"
                    value={values.admin_employee_code || ''}
                    onChange={onChange}
                    leftIcon={<User className="w-4 h-4" />}
                    errorText={errors.admin_employee_code}
                    disabled={disabled}
                    required
                />
                <Input
                    id="admin_full_name"
                    name="admin_full_name"
                    type="text"
                    label="Full Name"
                    placeholder="e.g., John Doe"
                    value={values.admin_full_name || ''}
                    onChange={onChange}
                    errorText={errors.admin_full_name}
                    disabled={disabled}
                    required
                />
            </div>

            {/* Login Email */}
            <Input
                id="admin_email"
                name="admin_email"
                type="email"
                label="Login Email"
                placeholder="admin@company.hrnexus.com"
                value={values.admin_email || ''}
                onChange={onChange}
                leftIcon={<Mail className="w-4 h-4" />}
                errorText={errors.admin_email}
                disabled={disabled}
                required
            />

            {/* Password */}
            <div className="space-y-1.5">
                <label
                    htmlFor="admin_password"
                    className="block text-sm font-semibold text-text-secondary"
                >
                    Password <span className="text-error">*</span>
                </label>
                <Input
                    id="admin_password"
                    name="admin_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={values.admin_password || ''}
                    onChange={onChange}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
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
                    errorText={errors.admin_password}
                    helperText="Password must contain at least 8 characters, including uppercase, lowercase letters and numbers."
                    disabled={disabled}
                />
            </div>
        </div>
    )
}

export default AdminInfoSection
