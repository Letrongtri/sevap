import { AlertCircle, Building2, Edit3 } from 'lucide-react'
import Button from '../ui/Button'
import { useTenantAdminDashboardStore } from '../../store/tenantAdminDashboardStore'
import Input from '../ui/Input'
import { useState } from 'react'
import { useGetTenantInfo, useUpdateTenant } from '../../hooks/useTenant'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'
import type { UpdateTenantPayload } from '../../types/tenant'
import { toast } from 'sonner'
import DomainInput from '../ui/DomainInput'

export default function TenantInfoCard() {
    const { isEditingTenant, setIsEditingTenant } =
        useTenantAdminDashboardStore()

    const { data, isLoading, isError, refetch } = useGetTenantInfo()
    const updateTenantMutation = useUpdateTenant()

    const [companyName, setCompanyName] = useState(data?.company_name || '')
    const [companyEmail, setCompanyEmail] = useState(data?.company_email || '')
    const [companyPhone, setCompanyPhone] = useState(data?.company_phone || '')
    const [companyAddress, setCompanyAddress] = useState(
        data?.company_address || ''
    )
    const [companyDomain, setCompanyDomain] = useState(
        data?.tenant_domain || ''
    )
    const [companyDescription, setCompanyDescription] = useState(
        data?.company_description || ''
    )

    const handleOpenEditTenant = () => {
        setCompanyName(data?.company_name || '')
        setCompanyEmail(data?.company_email || '')
        setCompanyPhone(data?.company_phone || '')
        setCompanyAddress(data?.company_address || '')
        setCompanyDomain(data?.tenant_domain || '')
        setCompanyDescription(data?.company_description || '')
        setIsEditingTenant(true)
    }

    const handleSave = async () => {
        if (!data) return
        const payload: UpdateTenantPayload = {
            id: data.id,
            tenant_domain: companyDomain,
            company_name: companyName,
            company_description: companyDescription,
            company_email: companyEmail,
            company_phone: companyPhone,
            company_address: companyAddress,
        }

        await updateTenantMutation.mutateAsync(payload, {
            onSuccess: () => {
                toast.success('Cập nhật thông tin công ty thành công!')
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Cập nhật thông tin công ty thất bại'
                )
            },
        })
        setIsEditingTenant(false)
    }

    const handleCancel = () => {
        setIsEditingTenant(false)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải thông tin công ty...
                </p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Tải thông tin công ty thất bại
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    Đã xảy ra lỗi khi tải thông tin công ty
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Thử lại
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
                {/* Company icon */}
                <div className="flex items-center">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Building2 className="w-7 h-7" />
                    </div>
                </div>

                <div className="flex flex-col flex-1 items-start justify-start gap-1">
                    <p className="font-bold text-primary uppercase tracking-wider">
                        Thông tin công ty
                    </p>
                    <p className="text-xs text-text-muted bg-bg px-2 py-0.5 rounded-md border border-border/60">
                        Mã công ty: {data?.id}
                    </p>
                </div>

                {!isEditingTenant ? (
                    <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={handleOpenEditTenant}
                    >
                        Chỉnh sửa
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCancel}
                        >
                            Hủy
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleSave}>
                            Lưu
                        </Button>
                    </div>
                )}
            </div>

            {/* Main info grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-x-8 gap-y-4">
                {/* Company Name */}
                <div className="lg:col-span-4">
                    <InfoRow label="TÊN CÔNG TY">
                        {!isEditingTenant ? (
                            <span className="font-bold text-text-primary text-sm">
                                {data?.company_name}
                            </span>
                        ) : (
                            <Input
                                type="text"
                                className="border border-border/50 rounded-xl px-4 py-2 text-sm"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        )}
                    </InfoRow>
                </div>

                {/* Email */}
                <div className="lg:col-span-2">
                    <InfoRow label="EMAIL CÔNG TY">
                        {!isEditingTenant ? (
                            <span className="text-sm text-text-secondary">
                                {data?.company_email}
                            </span>
                        ) : (
                            <Input
                                type="text"
                                className="border border-border/50 rounded-xl px-4 py-2 text-sm"
                                value={companyEmail}
                                onChange={(e) =>
                                    setCompanyEmail(e.target.value)
                                }
                            />
                        )}
                    </InfoRow>
                </div>

                {/* Phone */}
                <div className="lg:col-span-2">
                    <InfoRow label="SỐ ĐIỆN THOẠI">
                        {!isEditingTenant ? (
                            <span className="text-sm font-semibold text-text-secondary">
                                {data?.company_phone}
                            </span>
                        ) : (
                            <Input
                                type="text"
                                className="border border-border/50 rounded-xl px-4 py-2 text-sm"
                                value={companyPhone}
                                onChange={(e) =>
                                    setCompanyPhone(e.target.value)
                                }
                            />
                        )}
                    </InfoRow>
                </div>

                {/* Address */}
                <div className="lg:col-span-4">
                    <InfoRow label="ĐỊA CHỈ">
                        {!isEditingTenant ? (
                            <span className="text-sm text-text-secondary">
                                {data?.company_address}
                            </span>
                        ) : (
                            <Input
                                type="text"
                                className="border border-border/50 rounded-xl px-4 py-2 text-sm"
                                value={companyAddress}
                                onChange={(e) =>
                                    setCompanyAddress(e.target.value)
                                }
                            />
                        )}
                    </InfoRow>
                </div>

                {/* Domain */}
                <div className="lg:col-span-2">
                    <InfoRow label="TÊN MIỀN CÔNG TY">
                        {!isEditingTenant ? (
                            <span className="text-sm font-semibold text-primary">
                                {data?.tenant_domain}
                            </span>
                        ) : (
                            <DomainInput
                                id="tenant_domain"
                                name="tenant_domain"
                                placeholder="company"
                                value={companyDomain}
                                onChange={(e) =>
                                    setCompanyDomain(e.target.value)
                                }
                            />
                        )}
                    </InfoRow>
                </div>

                {/* Lifecycle */}
                <div className="lg:col-span-2">
                    <InfoRow label="VÒNG ĐỜI THÔNG TIN">
                        <div className="text-xs text-text-muted space-y-0.5">
                            <div>
                                Ngày tạo:{' '}
                                {formatDateTimeToDDMMYYYY(
                                    data?.created_at ?? ''
                                )}
                            </div>
                            <div>
                                Cập nhật:{' '}
                                {formatDateTimeToDDMMYYYY(
                                    data?.updated_at ?? ''
                                )}
                            </div>
                        </div>
                    </InfoRow>
                </div>
            </div>

            {/* Description */}
            <div className="px-5 pb-5">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Mô tả công ty
                </div>
                {!isEditingTenant ? (
                    data?.company_description && (
                        <p className="text-xs text-text-secondary leading-relaxed bg-bg/60 border border-border/40 rounded-xl px-4 py-3">
                            {data.company_description}
                        </p>
                    )
                ) : (
                    <Input
                        type="text"
                        className="border border-border/50 rounded-xl px-4 py-2 text-sm"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                    />
                )}
            </div>
        </div>
    )
}

function InfoRow({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                {label}
            </div>
            {children}
        </div>
    )
}
