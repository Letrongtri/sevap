import { useState, useEffect } from 'react'
import type { Tenant, AdminCreateTenantPayload, AdminUpdateTenantPayload } from '../../../types/tenant'
import {
    useCreateGlobalTenant,
    useDeleteGlobalTenant,
    useUpdateGlobalTenant,
} from '../../../hooks/useGlobalTenants'
import { toast } from 'sonner'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    User,
    Lock,
    Shield,
    Trash2,
    Save,
    PauseCircle,
    PlayCircle,
    Eye,
    EyeOff,
} from 'lucide-react'
import DomainInput from '../../ui/DomainInput'

interface DetailTenantFormProps {
    selectedTenant: Tenant | null
    onCloseCard: () => void
}

export function DetailTenantForm({
    selectedTenant,
    onCloseCard,
}: DetailTenantFormProps) {
    const isAdding = !selectedTenant

    const createMutation = useCreateGlobalTenant()
    const updateMutation = useUpdateGlobalTenant()
    const deleteMutation = useDeleteGlobalTenant()

    // Show/Hide password toggle for admin creation
    const [showPassword, setShowPassword] = useState(false)

    // Confirm dialog state for deletion or status toggling
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showStatusConfirm, setShowStatusConfirm] = useState(false)
    const [targetStatus, setTargetStatus] = useState<string>('')

    // Form state for existing tenant
    const [editForm, setEditForm] = useState<AdminUpdateTenantPayload>({
        company_name: '',
        company_description: '',
        company_email: '',
        company_phone: '',
        company_address: '',
        tenant_domain: '',
        status: 'active',
    })

    // Form state for new tenant
    const [addForm, setAddForm] = useState<AdminCreateTenantPayload>({
        company_name: '',
        tenant_domain: '',
        company_description: '',
        company_email: '',
        company_phone: '',
        company_address: '',
        admin_employee_code: 'ADMIN-001',
        admin_full_name: '',
        admin_email: '',
        admin_password: '',
    })

    useEffect(() => {
        if (selectedTenant) {
            setEditForm({
                company_name: selectedTenant.company_name,
                company_description: selectedTenant.company_description || '',
                company_email: selectedTenant.company_email,
                company_phone: selectedTenant.company_phone,
                company_address: selectedTenant.company_address,
                tenant_domain: selectedTenant.tenant_domain,
                status: selectedTenant.status,
            })
        }
    }, [selectedTenant])

    // Handlers for Add mode
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!addForm.company_name.trim()) {
            toast.error('Vui lòng nhập tên công ty')
            return
        }
        if (!addForm.tenant_domain.trim()) {
            toast.error('Vui lòng nhập domain tenant')
            return
        }
        if (!addForm.company_email.trim()) {
            toast.error('Vui lòng nhập email công ty')
            return
        }
        if (!addForm.company_phone.trim()) {
            toast.error('Vui lòng nhập số điện thoại công ty')
            return
        }
        if (!addForm.company_address.trim()) {
            toast.error('Vui lòng nhập địa chỉ công ty')
            return
        }
        if (!addForm.admin_full_name.trim()) {
            toast.error('Vui lòng nhập tên người quản trị Admin')
            return
        }
        if (!addForm.admin_email.trim()) {
            toast.error('Vui lòng nhập email quản trị Admin')
            return
        }
        if (!addForm.admin_password.trim()) {
            toast.error('Vui lòng nhập mật khẩu quản trị Admin')
            return
        }

        createMutation.mutate(addForm, {
            onSuccess: (newTenant) => {
                toast.success(`Đã tạo thành công Tenant "${newTenant.company_name}"!`)
                onCloseCard()
            },
            onError: (err: any) => {
                const msg = err.response?.data?.detail || err.message || 'Tạo tenant thất bại'
                toast.error(`Lỗi: ${msg}`)
            },
        })
    }

    // Handlers for Edit mode
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTenant) return

        updateMutation.mutate(
            { id: selectedTenant.id, payload: editForm },
            {
                onSuccess: (updated) => {
                    toast.success(`Đã cập nhật thông tin Tenant "${updated.company_name}"!`)
                },
                onError: (err: any) => {
                    const msg = err.response?.data?.detail || err.message || 'Cập nhật thất bại'
                    toast.error(`Lỗi: ${msg}`)
                },
            }
        )
    }

    const handleConfirmToggleStatus = () => {
        if (!selectedTenant || !targetStatus) return

        updateMutation.mutate(
            { id: selectedTenant.id, payload: { status: targetStatus } },
            {
                onSuccess: () => {
                    toast.success(
                        `Đã chuyển trạng thái tenant thành "${targetStatus === 'suspended' ? 'Tạm dừng' : 'Hoạt động'}"!`
                    )
                    setShowStatusConfirm(false)
                },
                onError: (err: any) => {
                    toast.error(`Không thể đổi trạng thái: ${err.message}`)
                    setShowStatusConfirm(false)
                },
            }
        )
    }

    const handleConfirmDelete = () => {
        if (!selectedTenant) return

        deleteMutation.mutate(selectedTenant.id, {
            onSuccess: () => {
                toast.success(`Đã xóa tenant "${selectedTenant.company_name}"!`)
                setShowDeleteConfirm(false)
                onCloseCard()
            },
            onError: (err: any) => {
                toast.error(`Xóa tenant thất bại: ${err.message}`)
                setShowDeleteConfirm(false)
            },
        })
    }

    if (isAdding) {
        return (
            <form onSubmit={handleAddSubmit} className="space-y-6">
                {/* Block 1: Company details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                            1. Thông tin doanh nghiệp
                        </h3>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Tên công ty / Tổ chức <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ví dụ: Công ty Cổ phần FPT"
                            value={addForm.company_name}
                            onChange={(e) =>
                                setAddForm((prev) => ({
                                    ...prev,
                                    company_name: e.target.value,
                                }))
                            }
                            className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Domain Tenant <span className="text-error">*</span>
                        </label>
                        <DomainInput
                            value={addForm.tenant_domain}
                            onChange={(e) =>
                                setAddForm((prev) => ({
                                    ...prev,
                                    tenant_domain: e.target.value,
                                }))
                            }
                            placeholder="ví dụ: fpt-software"
                            disabled={createMutation.isPending}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Email công ty <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    placeholder="contact@fpt.com"
                                    value={addForm.company_email}
                                    onChange={(e) =>
                                        setAddForm((prev) => ({
                                            ...prev,
                                            company_email: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Số điện thoại <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="024 7300 7300"
                                    value={addForm.company_phone}
                                    onChange={(e) =>
                                        setAddForm((prev) => ({
                                            ...prev,
                                            company_phone: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Địa chỉ công ty <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="w-4 h-4 text-text-placeholder absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Tòa nhà FPT Tower, Phạm Văn Bạch, Cầu Giấy, Hà Nội"
                                value={addForm.company_address}
                                onChange={(e) =>
                                    setAddForm((prev) => ({
                                        ...prev,
                                        company_address: e.target.value,
                                    }))
                                }
                                className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Mô tả thêm
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Mô tả ngành nghề hoặc ghi chú quản trị..."
                            value={addForm.company_description || ''}
                            onChange={(e) =>
                                setAddForm((prev) => ({
                                    ...prev,
                                    company_description: e.target.value,
                                }))
                            }
                            className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder resize-none"
                        />
                    </div>
                </div>

                {/* Block 2: Admin initial credentials */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                            2. Tài khoản Quản trị viên khởi tạo
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Mã nhân viên Admin <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="ADMIN-001"
                                value={addForm.admin_employee_code}
                                onChange={(e) =>
                                    setAddForm((prev) => ({
                                        ...prev,
                                        admin_employee_code: e.target.value,
                                    }))
                                }
                                className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Họ và tên Admin <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={addForm.admin_full_name}
                                    onChange={(e) =>
                                        setAddForm((prev) => ({
                                            ...prev,
                                            admin_full_name: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Email Admin đăng nhập <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                placeholder="admin@fpt.com"
                                value={addForm.admin_email}
                                onChange={(e) =>
                                    setAddForm((prev) => ({
                                        ...prev,
                                        admin_email: e.target.value,
                                    }))
                                }
                                className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Mật khẩu khởi tạo <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Tối thiểu 8 ký tự, bao gồm chữ và số"
                                value={addForm.admin_password}
                                onChange={(e) =>
                                    setAddForm((prev) => ({
                                        ...prev,
                                        admin_password: e.target.value,
                                    }))
                                }
                                className="w-full pl-9 pr-10 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text-secondary"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCloseCard}
                        disabled={createMutation.isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={createMutation.isPending}
                        loadingText="Đang khởi tạo Tenant..."
                        leftIcon={<Building2 className="w-4 h-4" />}
                    >
                        Tạo Tenant mới
                    </Button>
                </div>
            </form>
        )
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Tên công ty / Tổ chức <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        value={editForm.company_name || ''}
                        onChange={(e) =>
                            setEditForm((prev) => ({
                                ...prev,
                                company_name: e.target.value,
                            }))
                        }
                        className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-text-primary"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Domain Tenant
                    </label>
                    <div className="relative">
                        <Globe className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={editForm.tenant_domain || ''}
                            onChange={(e) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    tenant_domain: e.target.value,
                                }))
                            }
                            className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-primary font-medium"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Email công ty
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={editForm.company_email || ''}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        company_email: e.target.value,
                                    }))
                                }
                                className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Số điện thoại
                        </label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={editForm.company_phone || ''}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        company_phone: e.target.value,
                                    }))
                                }
                                className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Địa chỉ công ty
                    </label>
                    <div className="relative">
                        <MapPin className="w-4 h-4 text-text-placeholder absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={editForm.company_address || ''}
                            onChange={(e) =>
                                setEditForm((prev) => ({
                                    ...prev,
                                    company_address: e.target.value,
                                }))
                            }
                            className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Mô tả
                    </label>
                    <textarea
                        rows={2}
                        value={editForm.company_description || ''}
                        onChange={(e) =>
                            setEditForm((prev) => ({
                                ...prev,
                                company_description: e.target.value,
                            }))
                        }
                        className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Trạng thái hoạt động
                    </label>
                    <select
                        value={editForm.status || 'active'}
                        onChange={(e) =>
                            setEditForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                            }))
                        }
                        className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-primary"
                    >
                        <option value="active">Hoạt động (Active)</option>
                        <option value="suspended">Tạm dừng (Suspended)</option>
                        <option value="inactive">Ngừng hoạt động (Inactive)</option>
                    </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={updateMutation.isPending}
                        loadingText="Đang lưu..."
                        leftIcon={<Save className="w-4 h-4" />}
                    >
                        Cập nhật thông tin
                    </Button>
                </div>
            </form>

            {/* Quick admin control actions section */}
            <div className="border-t border-border/40 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Thao tác hệ thống
                </h4>

                <div className="flex flex-wrap gap-2">
                    {selectedTenant?.status === 'suspended' ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setTargetStatus('active')
                                setShowStatusConfirm(true)
                            }}
                            leftIcon={<PlayCircle className="w-4 h-4 text-emerald-600" />}
                        >
                            Kích hoạt lại Tenant
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setTargetStatus('suspended')
                                setShowStatusConfirm(true)
                            }}
                            leftIcon={<PauseCircle className="w-4 h-4 text-amber-600" />}
                        >
                            Tạm dừng Tenant
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                        Xóa Tenant
                    </Button>
                </div>
            </div>

            {/* Status confirmation dialog */}
            <ConfirmDialog
                isOpen={showStatusConfirm}
                onClose={() => setShowStatusConfirm(false)}
                onConfirm={handleConfirmToggleStatus}
                title={
                    targetStatus === 'suspended'
                        ? 'Tạm dừng Tenant?'
                        : 'Kích hoạt lại Tenant?'
                }
                description={
                    targetStatus === 'suspended'
                        ? `Tất cả người dùng thuộc "${selectedTenant?.company_name}" sẽ bị tạm khóa truy cập vào hệ thống.`
                        : `Cho phép người dùng thuộc "${selectedTenant?.company_name}" truy cập lại hệ thống bình thường.`
                }
                confirmLabel={targetStatus === 'suspended' ? 'Xác nhận tạm dừng' : 'Kích hoạt ngay'}
                variant={targetStatus === 'suspended' ? 'danger' : 'primary'}
                isLoading={updateMutation.isPending}
            />

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa Tenant này?"
                description={`Hành động này sẽ chuyển trạng thái của "${selectedTenant?.company_name}" sang Đã xóa. Bạn có chắc chắn muốn tiếp tục?`}
                confirmLabel="Xóa Tenant"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    )
}

export default DetailTenantForm
