import { SquarePen, Users, FileText } from 'lucide-react'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { PERMISSIONS } from '../../lib/permissions'
import { NavItem } from './NavItem'
import { usePermission } from '../../hooks/usePermission'

/* ============================================================
   MainNavigation — Permission & Role-based sidebar nav

   Ma trận quyền (từ default_roles.py):
   ┌──────────────────┬───────┬────────────┬──────────┐
   │ Feature          │ Admin │ HR Manager │ Employee │
   ├──────────────────┼───────┼────────────┼──────────┤
   │ Chat & Danh bạ   │  ✅   │     ✅     │    ✅   │
   │ Tài liệu (nav)   │  ✅   │     ✅     │    ❌   │
   └──────────────────┴───────┴────────────┴──────────┘

   - Admin    = Xác định dựa trên vai trò (role 'admin')
   - HRMgr   = documents:upload (NOT users:create)
   - Employee = conversations:send (documents:read nhưng KHÔNG có upload)

   Employee có documents:read nhưng KHÔNG xem nav documents.
   ============================================================ */

const MainNavigation = ({
    collapsed,
    currentPath,
}: {
    collapsed: boolean
    currentPath: string
}) => {
    // ── Documents: upload (HR Manager + Admin) ────────────────
    // Employee chỉ có documents:read, KHÔNG có documents:upload
    const canUploadDocs = usePermission(PERMISSIONS.DOCUMENTS_UPLOAD)

    return (
        <div className="flex-shrink-0 px-2 pt-4 pb-2 border-b border-border/40">
            {/* ── Core navigation (always shown) ─────────────── */}
            <div className="space-y-0.5">
                <NavItem
                    label="Đoạn chat mới"
                    icon={SquarePen}
                    to={PRIVATE_ROUTES.HOME}
                    collapsed={collapsed}
                    currentPath={currentPath}
                />
                <NavItem
                    label="Danh bạ"
                    icon={Users}
                    to={PRIVATE_ROUTES.DIRECTORY}
                    collapsed={collapsed}
                    currentPath={currentPath}
                />
            </div>

            {/* ── Document nav: chỉ Admin + HR Manager thấy ── */}
            {canUploadDocs && (
                <div
                    className={[
                        'space-y-0.5',
                        collapsed ? 'mt-1 pt-1' : 'mt-3 pt-3',
                        'border-t border-border/30',
                    ].join(' ')}
                >
                    {!collapsed && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-placeholder px-3 pb-1">
                            Tài liệu
                        </p>
                    )}
                    <NavItem
                        label="Quản lý tài liệu"
                        icon={FileText}
                        to={PRIVATE_ROUTES.DOCUMENTS}
                        collapsed={collapsed}
                        currentPath={currentPath}
                    />
                </div>
            )}
        </div>
    )
}

export default MainNavigation
