import React from 'react'
import { Building2, AlertCircle } from 'lucide-react'
import { Input } from '../../ui/Input'
import { DomainInput } from '../../ui/DomainInput'

interface CompanyInfoSectionProps {
    values: {
        company_name: string | null
        tenant_domain: string | null
        company_email: string | null
        company_phone: string | null
        company_address: string | null
        company_description: string | null
    }
    errors: {
        company_name?: string
        tenant_domain?: string
        company_email?: string
        company_phone?: string
        company_address?: string
        company_description?: string
    }
    disabled?: boolean
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void
}

export const CompanyInfoSection: React.FC<CompanyInfoSectionProps> = ({
    values,
    errors,
    disabled = false,
    onChange,
}) => {
    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase border-b border-border/40 pb-2">
                <Building2 className="w-4 h-4" />
                <span>Company Information</span>
            </div>

            {/* Company Name */}
            <Input
                id="company_name"
                name="company_name"
                type="text"
                label="Company Name"
                placeholder="e.g., HR Nexus Co., Ltd."
                value={values.company_name ?? ''}
                onChange={onChange}
                errorText={errors.company_name}
                disabled={disabled}
                required
            />

            {/* Tenant Domain */}
            <DomainInput
                id="tenant_domain"
                name="tenant_domain"
                label="Tenant Domain"
                placeholder="company"
                value={values.tenant_domain ?? ''}
                onChange={onChange}
                errorText={errors.tenant_domain}
                disabled={disabled}
                required
            />

            {/* Email & Phone Number (Side-by-Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    id="company_email"
                    name="company_email"
                    type="email"
                    label="Contact Email"
                    placeholder="contact@company.com"
                    value={values.company_email ?? ''}
                    onChange={onChange}
                    errorText={errors.company_email}
                    disabled={disabled}
                    required
                />
                <Input
                    id="company_phone"
                    name="company_phone"
                    type="tel"
                    label="Phone Number"
                    placeholder="(+84) 123 456 789"
                    value={values.company_phone ?? ''}
                    onChange={onChange}
                    errorText={errors.company_phone}
                    disabled={disabled}
                    required
                />
            </div>

            {/* Headquarters Address */}
            <Input
                id="company_address"
                name="company_address"
                type="text"
                label="Headquarters Address"
                placeholder="e.g., 123 ABC Street, District XYZ, HCMC"
                value={values.company_address ?? ''}
                onChange={onChange}
                errorText={errors.company_address}
                disabled={disabled}
                required
            />

            {/* Brief Description */}
            <div className="space-y-1.5">
                <label
                    htmlFor="company_description"
                    className="block text-sm font-semibold text-text-secondary"
                >
                    Brief Description
                </label>
                <textarea
                    id="company_description"
                    name="company_description"
                    rows={3}
                    disabled={disabled}
                    placeholder="Enter a short description of your company..."
                    value={values.company_description ?? ''}
                    onChange={onChange}
                    className={[
                        'block w-full bg-surface-raised border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder resize-none outline-none transition-all duration-200',
                        errors.company_description
                            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
                            : 'border-border hover:border-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20',
                    ].join(' ')}
                />
                {errors.company_description && (
                    <p
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-error animate-fade-in-down"
                    >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errors.company_description}
                    </p>
                )}
            </div>
        </div>
    )
}

export default CompanyInfoSection
