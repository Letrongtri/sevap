import {
    SquarePen,
    Users,
    FileText,
    ShieldCheck,
    Building2,
    Briefcase,
    UserCog,
    History,
    BotMessageSquare,
} from 'lucide-react'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { PERMISSIONS } from '../../lib/permissions'
import { NavItem } from './NavItem'
import { useIsAdmin, usePermission } from '../../hooks/usePermission'

/* ============================================================
   MainNavigation — Permission & Role-based sidebar nav

   Ma trận quyền (từ default_roles.py):
   ┌──────────────────────┬───────┬────────────┬──────────┐
   │ Feature              │ Admin │ knowledge_manager │ Employee │
   ├──────────────────────┼───────┼────────────┼──────────┤
   │ Chat & Danh bạ       │  ✅   │     ✅     │    ✅   │
   │ Tài liệu (nav)       │  ✅   │     ✅     │    ❌   │
   │ Quản lý tài khoản    │  ✅   │     ❌     │    ❌   │
   │ Quản lý vai trò      │  ✅   │     ❌     │    ❌   │
   │ Quản lý phòng ban    │  ✅   │     ❌     │    ❌   │
   │ Quản lý chức danh    │  ✅   │     ❌     │    ❌   │
   │ Nhật ký hoạt động    │  ✅   │     ❌     │    ❌   │
   │ Prompt templates     │  ✅   │     ❌     │    ❌   │
   └──────────────────────┴───────┴────────────┴──────────┘

   Mỗi nav item kiểm tra permission tương ứng từ store — không
   hard-code role. knowledge_manager có thể được cấp thêm quyền một cách
   linh hoạt mà không cần sửa code.
   ============================================================ */

const MainNavigation = ({
    collapsed,
    currentPath,
}: {
    collapsed: boolean
    currentPath: string
}) => {
    // ── Zone 2: Management pages — sync với route guards ────
    // Sử dụng cùng permission với beforeLoad trong tenantRoutes.tsx
    // để đảm bảo: nếu thấy nav item thì luôn vào được trang.
    const canUploadDocs = usePermission(PERMISSIONS.DOCUMENTS_UPLOAD)
    const canCreateUsers = usePermission(PERMISSIONS.USERS_CREATE)
    const canCreateRoles = usePermission(PERMISSIONS.ROLES_CREATE)
    const canCreateDepts = usePermission(PERMISSIONS.DEPARTMENTS_CREATE)
    const canCreateJobTitles = usePermission(PERMISSIONS.JOB_TITLES_CREATE)
    const canReadLogs = usePermission(PERMISSIONS.ACTIVITY_LOGS_READ)
    const canCreatePromptTpl = usePermission(
        PERMISSIONS.PROMPT_TEMPLATES_CREATE
    )

    const isAdmin = useIsAdmin()

    // Section "Quản lý" hiện ra khi có ít nhất 1 quyền quản lý
    const showManageSection =
        !isAdmin &&
        (canCreateUsers ||
            canCreateRoles ||
            canCreateDepts ||
            canCreateJobTitles ||
            canReadLogs ||
            canCreatePromptTpl)

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

            {/* ── Document nav: chỉ Admin + knowledge_manager thấy ── */}
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

            {/* ── Management nav: hiển thị theo từng permission ── */}
            {showManageSection && (
                <div
                    className={[
                        'space-y-0.5',
                        collapsed ? 'mt-1 pt-1' : 'mt-3 pt-3',
                        'border-t border-border/30',
                    ].join(' ')}
                >
                    {!collapsed && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-placeholder px-3 pb-1">
                            Quản lý
                        </p>
                    )}

                    {canCreateUsers && (
                        <NavItem
                            label="Tài khoản"
                            icon={UserCog}
                            to={PRIVATE_ROUTES.MANAGE_ACCOUNTS}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}

                    {canCreateRoles && (
                        <NavItem
                            label="Vai trò & Phân quyền"
                            icon={ShieldCheck}
                            to={PRIVATE_ROUTES.MANAGE_ROLES}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}

                    {canCreateDepts && (
                        <NavItem
                            label="Phòng ban"
                            icon={Building2}
                            to={PRIVATE_ROUTES.MANAGE_DEPARTMENTS}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}

                    {canCreateJobTitles && (
                        <NavItem
                            label="Chức danh"
                            icon={Briefcase}
                            to={PRIVATE_ROUTES.MANAGE_JOB_TITLES}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}

                    {canCreatePromptTpl && (
                        <NavItem
                            label="Quản lý prompt"
                            icon={BotMessageSquare}
                            to={PRIVATE_ROUTES.MANAGE_PROMPT_TEMPLATES}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}

                    {canReadLogs && (
                        <NavItem
                            label="Nhật ký hoạt động"
                            icon={History}
                            to={PRIVATE_ROUTES.MANAGE_LOGS}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default MainNavigation
