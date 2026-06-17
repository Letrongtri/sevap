from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import User, Role, UserRole, Permission, RolePermission, Tenants
from app.utils.auth import hash_password
from app.core.logging import logger

async def add_system_default_data(db: AsyncSession):
    # 1. Kiểm tra xem dữ liệu Tenant đã tồn tại chưa
    result = await db.execute(select(Tenants).limit(1))
    first_tenant = result.scalars().first()
    
    if first_tenant is not None:
        print("Dữ liệu mặc định đã tồn tại. Bỏ qua bước Seeding.")
        return

    logger.info("Bắt đầu khởi tạo dữ liệu mặc định")

    # 2. Khởi tạo default Tenant
    tenant = Tenants(
        company_name="System Default",
        company_description="Hệ thống mặc định cho doanh nghiệp",
        company_email="system@company.local",
        company_phone="0123456789",
        company_address="Trụ sở chính",
        tenant_domain="system.local",
        status="active"
    )
    db.add(tenant)
    await db.flush() # Lấy ID của tenant

    # 3. Khởi tạo danh sách Roles cốt lõi cho hệ thống scoped theo default Tenant
    roles = [
        Role(
            tenant_id=tenant.id,
            name="admin", 
            description="Quản trị viên hệ thống, toàn quyền truy cập", 
            access_level="managerial", 
            is_system=True
        ),
        Role(
            tenant_id=tenant.id,
            name="manager", 
            description="Quản lý Nhân sự", 
            access_level="managerial", 
            is_system=True
        ),
        Role(
            tenant_id=tenant.id,
            name="employee", 
            description="Nhân viên tiêu chuẩn, truy cập dữ liệu public/private", 
            access_level="private", 
            is_system=True
        ),
        Role(
            tenant_id=tenant.id,
            name="guest", 
            description="Khách hoặc Thực tập sinh, chỉ đọc dữ liệu public", 
            access_level="public", 
            is_system=True
        )
    ]
    db.add_all(roles)
    await db.flush() # Đẩy roles vào session để lấy được ID

    # 4. Khởi tạo danh sách Permissions cốt lõi cho hệ thống (toàn cục)
    permissions_data = [
        # Module: System's User Management
        Permission(resource="users", action="read", description="Xem tài khoản người dùng"),
        Permission(resource="users", action="write", description="Tạo hoặc cập nhật tài khoản"),
        Permission(resource="users", action="delete", description="Vô hiệu hóa hoặc xóa tài khoản"),
        # Module: Role Management
        Permission(resource="roles", action="read", description="Xem vai trò và quyền"),
        Permission(resource="roles", action="write", description="Thêm hoặc cập nhật vai trò và quyền"),
        Permission(resource="roles", action="delete", description="Xóa vai trò và quyền không phải là vai trò mặc định hệ thống"),
        # Module: Knowledge & Documents Management
        Permission(resource="documents", action="read", description="Đọc tài liệu"),
        Permission(resource="documents", action="write", description="Tải lên hoặc cập nhật tài liệu"),
        Permission(resource="documents", action="delete", description="Xóa tài liệu"),
        Permission(resource="documents", action="manage", description="Thiết lập cấp độ truy cập tài liệu"),
        # Module: Embedding / Vector DB Management
        Permission(resource="embeddings", action="manage", description="Kích hoạt và quản lý Vector DB"),
        # Module: Chat Management
        Permission(resource="chat", action="read", description="Xem lịch sử chat cá nhân"),
        Permission(resource="chat", action="manage", description="Quản lý toàn bộ chat hệ thống"),
        # Module: Integration Config (MCP)
        Permission(resource="mcp_servers", action="manage", description="Cấu hình tích hợp MCP Servers"),
        # Module: System Management
        Permission(resource="prompt_templates", action="manage", description="Quản lý Prompt Templates"),
        # Module: Information Query
        Permission(resource="reports", action="read", description="Truy cập báo cáo quản trị"),
        Permission(resource="tasks", action="execute", description="Thực thi tác vụ Actionable (họp, phép, v.v.)")
    ]
    db.add_all(permissions_data)
    await db.flush()

    # 5. Khởi tạo RolePermissions cốt lõi cho hệ thống
    role_map = {r.name: r for r in roles}
    
    admin_perms = permissions_data # Admin có tất cả quyền
    manager_perms = [p for p in permissions_data if p.resource in ["users", "documents", "reports", "chat", "tasks"] and p.action != "delete"]
    employee_perms = [p for p in permissions_data if (p.resource == "documents" and p.action == "read") or (p.resource == "chat" and p.action == "read") or (p.resource == "tasks" and p.action == "execute")]
    guest_perms = [p for p in permissions_data if p.resource == "documents" and p.action == "read"]

    role_permissions = []
    # Gán quyền cho Admin
    for p in admin_perms:
        role_permissions.append(RolePermission(role_id=role_map["admin"].id, permission_id=p.id))
    # Gán quyền cho Manager
    for p in manager_perms:
        role_permissions.append(RolePermission(role_id=role_map["manager"].id, permission_id=p.id))
    # Gán quyền cho Employee
    for p in employee_perms:
        role_permissions.append(RolePermission(role_id=role_map["employee"].id, permission_id=p.id))
    # Gán quyền cho Guest
    for p in guest_perms:
        role_permissions.append(RolePermission(role_id=role_map["guest"].id, permission_id=p.id))

    db.add_all(role_permissions)
    await db.flush()

    # 6. Khởi tạo tài khoản System Admin thuộc default Tenant
    admin_user = User(
        employee_code="admin",
        email="admin@company.local",
        full_name="System Administrator",
        password=hash_password("Admin@1234"),
        is_active=True,
        tenant_id=tenant.id
    )
    db.add(admin_user)
    await db.flush()

    # 7. Gán quyền 'admin' cho tài khoản Admin vừa tạo
    admin_role_mapping = UserRole(
        user_id=admin_user.id,
        role_id=role_map["admin"].id,
        assigned_by=admin_user.id
    )
    db.add(admin_role_mapping)

    # 8. Lưu toàn bộ thay đổi vào CSDL vật lý
    await db.commit()
    logger.info("Khởi tạo dữ liệu mặc định thành công!")
