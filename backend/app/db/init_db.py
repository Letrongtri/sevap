from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import User, Role, UserRole, Permission, RolePermission, Tenants
from app.utils.auth import hash_password
from app.core.logging import logger
from app.core.enum import PermissionResource, PermissionAction, AccessLevel, DefaultRole

# Danh sách tất cả permissions cần tồn tại trong hệ thống
ALL_PERMISSIONS = [
    # Resource: tenants
    (PermissionResource.TENANTS, PermissionAction.CREATE, "Tạo công ty mới"),
    (PermissionResource.TENANTS, PermissionAction.READ, "Xem thông tin công ty"),
    (PermissionResource.TENANTS, PermissionAction.UPDATE, "Cập nhật thông tin công ty"),
    (PermissionResource.TENANTS, PermissionAction.DELETE, "Xóa công ty"),
    (PermissionResource.TENANTS, PermissionAction.SUSPEND, "Đình chỉ công ty"),
    # Resource: permissions
    (PermissionResource.PERMISSIONS, PermissionAction.READ, "Xem danh sách quyền hạn"),
    # Resource: activity_logs
    (PermissionResource.ACTIVITY_LOGS, PermissionAction.READ, "Xem nhật ký hoạt động"),
    # Resource: users
    (PermissionResource.USERS, PermissionAction.CREATE, "Tạo tài khoản người dùng"),
    (PermissionResource.USERS, PermissionAction.READ, "Xem tài khoản người dùng"),
    (PermissionResource.USERS, PermissionAction.UPDATE, "Cập nhật tài khoản người dùng"),
    (PermissionResource.USERS, PermissionAction.DELETE, "Xóa tài khoản người dùng"),
    (PermissionResource.USERS, PermissionAction.SUSPEND, "Đình chỉ tài khoản người dùng"),
    # Resource: roles
    (PermissionResource.ROLES, PermissionAction.CREATE, "Tạo vai trò mới"),
    (PermissionResource.ROLES, PermissionAction.READ, "Xem vai trò và quyền hạn"),
    (PermissionResource.ROLES, PermissionAction.UPDATE, "Cập nhật vai trò và quyền hạn"),
    (PermissionResource.ROLES, PermissionAction.DELETE, "Xóa vai trò"),
    (PermissionResource.ROLES, PermissionAction.ASSIGN, "Gán vai trò cho người dùng"),
    # Resource: job_titles
    (PermissionResource.JOB_TITLES, PermissionAction.CREATE, "Tạo chức danh công việc"),
    (PermissionResource.JOB_TITLES, PermissionAction.READ, "Xem danh sách chức danh công việc"),
    (PermissionResource.JOB_TITLES, PermissionAction.UPDATE, "Cập nhật chức danh công việc"),
    (PermissionResource.JOB_TITLES, PermissionAction.DELETE, "Xóa chức danh công việc"),
    (PermissionResource.JOB_TITLES, PermissionAction.ASSIGN, "Gán chức danh công việc cho người dùng"),
    # Resource: documents
    (PermissionResource.DOCUMENTS, PermissionAction.CREATE, "Tạo tài liệu mới"),
    (PermissionResource.DOCUMENTS, PermissionAction.READ, "Xem/đọc tài liệu"),
    (PermissionResource.DOCUMENTS, PermissionAction.UPDATE, "Cập nhật thông tin tài liệu"),
    (PermissionResource.DOCUMENTS, PermissionAction.DELETE, "Xóa tài liệu"),
    (PermissionResource.DOCUMENTS, PermissionAction.UPLOAD, "Tải lên tài liệu"),
    (PermissionResource.DOCUMENTS, PermissionAction.DOWNLOAD, "Tải xuống tài liệu"),
    # Resource: departments
    (PermissionResource.DEPARTMENTS, PermissionAction.CREATE, "Tạo phòng ban mới"),
    (PermissionResource.DEPARTMENTS, PermissionAction.READ, "Xem thông tin phòng ban"),
    (PermissionResource.DEPARTMENTS, PermissionAction.UPDATE, "Cập nhật phòng ban"),
    (PermissionResource.DEPARTMENTS, PermissionAction.DELETE, "Xóa phòng ban"),
    (PermissionResource.DEPARTMENTS, PermissionAction.ASSIGN, "Gán phòng ban cho người dùng"),
    # Resource: conversations
    (PermissionResource.CONVERSATIONS, PermissionAction.CREATE, "Tạo cuộc trò chuyện mới"),
    (PermissionResource.CONVERSATIONS, PermissionAction.READ, "Xem lịch sử trò chuyện"),
    (PermissionResource.CONVERSATIONS, PermissionAction.UPDATE, "Cập nhật thông tin cuộc trò chuyện"),
    (PermissionResource.CONVERSATIONS, PermissionAction.DELETE, "Xóa cuộc trò chuyện"),
    (PermissionResource.CONVERSATIONS, PermissionAction.SEND, "Gửi tin nhắn trong cuộc trò chuyện"),
    # Resource: prompt_templates
    (PermissionResource.PROMPT_TEMPLATES, PermissionAction.CREATE, "Tạo prompt template mới"),
    (PermissionResource.PROMPT_TEMPLATES, PermissionAction.READ, "Xem danh sách prompt template"),
    (PermissionResource.PROMPT_TEMPLATES, PermissionAction.UPDATE, "Cập nhật prompt template"),
    (PermissionResource.PROMPT_TEMPLATES, PermissionAction.DELETE, "Xóa prompt template"),
]

async def ensure_permissions(db: AsyncSession):
    """Upsert toàn bộ permissions vào DB. Chạy mỗi lần khởi động để đồng bộ
    các permissions mới được thêm vào mà không làm ảnh hưởng dữ liệu cũ."""
    # Lấy tất cả permissions đang tồn tại trong DB
    result = await db.execute(select(Permission.resource, Permission.action))
    existing = {(row.resource, row.action) for row in result.all()}

    new_perms = []
    for resource, action, description in ALL_PERMISSIONS:
        res_val = resource.value if hasattr(resource, 'value') else resource
        act_val = action.value if hasattr(action, 'value') else action
        if (res_val, act_val) not in existing:
            new_perms.append(Permission(resource=resource, action=action, description=description))

    if new_perms:
        db.add_all(new_perms)
        await db.flush()
        logger.info(f"Đã thêm {len(new_perms)} permissions mới vào hệ thống.")

async def add_system_default_data(db: AsyncSession):
    # Bước 1: Luôn đồng bộ permissions (upsert) - chạy mỗi lần khởi động
    await ensure_permissions(db)

    # Bước 2: Kiểm tra xem dữ liệu User đã tồn tại chưa
    result = await db.execute(select(User).limit(1))
    first_user = result.scalars().first()

    if first_user is not None:
        await db.commit()  # Commit permissions mới nếu có
        print("Dữ liệu mặc định đã tồn tại. Bỏ qua bước Seeding User/Role.")
        return

    logger.info("Bắt đầu khởi tạo dữ liệu mặc định")

    # 3. Khởi tạo danh sách Roles cốt lõi cho hệ thống scoped theo default Tenant
    role = Role(
        name=DefaultRole.GLOBAL_ADMIN.value, 
        description="Quản trị viên toàn hệ thống, có thể quản lý các tenants", 
        access_level=AccessLevel.MANAGERIAL, 
        is_system=True
    )
    db.add(role)
    await db.flush()  # Đẩy role vào session để lấy được ID

    # 4. Lấy lại các permissions của Global Admin từ DB (đã được ensure_permissions chèn)
    from app.core.default_roles import DEFAULT_ROLES
    from app.core.enum import DefaultRole as DR
    ga_cfg = DEFAULT_ROLES[DR.GLOBAL_ADMIN]
    ga_resource_actions = {
        (res.value if hasattr(res, 'value') else res, act.value if hasattr(act, 'value') else act)
        for res, acts in ga_cfg["permissions"].items()
        for act in acts
    }
    perm_result = await db.execute(select(Permission))
    all_perms = perm_result.scalars().all()
    global_admin_permissions_data = [
        p for p in all_perms if (p.resource, p.action) in ga_resource_actions
    ]

    # 5. Khởi tạo RolePermissions cho global admin
    global_admin_permissions = [
        RolePermission(role_id=role.id, permission_id=p.id)
        for p in global_admin_permissions_data
    ]
    db.add_all(global_admin_permissions)
    await db.flush()

    # 6. Khởi tạo tài khoản System Admin thuộc default Tenant
    admin_user = User(
        employee_code="admin",
        email="admin@company.local",
        full_name="System Administrator",
        password=hash_password("Admin@1234"),
        is_active=True,
    )
    db.add(admin_user)
    await db.flush()

    # 7. Gán quyền 'global_admin' cho tài khoản Admin vừa tạo
    admin_role_mapping = UserRole(
        user_id=admin_user.id,
        role_id=role.id,
        assigned_by=admin_user.id
    )
    db.add(admin_role_mapping)

    # 8. Lưu toàn bộ thay đổi vào CSDL vật lý
    await db.commit()
    logger.info("Khởi tạo dữ liệu mặc định thành công!")
