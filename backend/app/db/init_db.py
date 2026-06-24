from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import User, Role, UserRole, Permission, RolePermission, Tenants
from app.utils.auth import hash_password
from app.core.logging import logger
from app.core.enum import PermissionResource, PermissionAction, AccessLevel, DefaultRole

async def add_system_default_data(db: AsyncSession):
    # 1. Kiểm tra xem dữ liệu User đã tồn tại chưa
    result = await db.execute(select(User).limit(1))
    first_user = result.scalars().first()
    
    if first_user is not None:
        print("Dữ liệu mặc định đã tồn tại. Bỏ qua bước Seeding.")
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
    await db.flush() # Đẩy roles vào session để lấy được ID

    # 4. Khởi tạo danh sách Permissions cốt lõi cho hệ thống (toàn cục)
    global_admin_permissions_data = [
        # Resource: tenants
        Permission(resource=PermissionResource.TENANTS, action=PermissionAction.CREATE, description="Tạo công ty mới"),
        Permission(resource=PermissionResource.TENANTS, action=PermissionAction.READ, description="Xem thông tin công ty"),
        Permission(resource=PermissionResource.TENANTS, action=PermissionAction.UPDATE, description="Cập nhật thông tin công ty"),
        Permission(resource=PermissionResource.TENANTS, action=PermissionAction.DELETE, description="Xóa công ty"),
        Permission(resource=PermissionResource.TENANTS, action=PermissionAction.SUSPEND, description="Đình chỉ công ty"),
        
        # Resource: permissions
        Permission(resource=PermissionResource.PERMISSIONS, action=PermissionAction.READ, description="Xem danh sách quyền hạn"),
        
        # Resource: activity_logs
        Permission(resource=PermissionResource.ACTIVITY_LOGS, action=PermissionAction.READ, description="Xem nhật ký hoạt động"),
    ]
    db.add_all(global_admin_permissions_data)
    await db.flush()

    other_permissions_data = [
        # Resource: users
        Permission(resource=PermissionResource.USERS, action=PermissionAction.CREATE, description="Tạo tài khoản người dùng"),
        Permission(resource=PermissionResource.USERS, action=PermissionAction.READ, description="Xem tài khoản người dùng"),
        Permission(resource=PermissionResource.USERS, action=PermissionAction.UPDATE, description="Cập nhật tài khoản người dùng"),
        Permission(resource=PermissionResource.USERS, action=PermissionAction.DELETE, description="Xóa tài khoản người dùng"),
        Permission(resource=PermissionResource.USERS, action=PermissionAction.SUSPEND, description="Đình chỉ tài khoản người dùng"),
        
        # Resource: roles
        Permission(resource=PermissionResource.ROLES, action=PermissionAction.CREATE, description="Tạo vai trò mới"),
        Permission(resource=PermissionResource.ROLES, action=PermissionAction.READ, description="Xem vai trò và quyền hạn"),
        Permission(resource=PermissionResource.ROLES, action=PermissionAction.UPDATE, description="Cập nhật vai trò và quyền hạn"),
        Permission(resource=PermissionResource.ROLES, action=PermissionAction.DELETE, description="Xóa vai trò"),
        Permission(resource=PermissionResource.ROLES, action=PermissionAction.ASSIGN, description="Gán vai trò cho người dùng"),
        
        # Resource: job_titles
        Permission(resource=PermissionResource.JOB_TITLES, action=PermissionAction.CREATE, description="Tạo chức danh công việc"),
        Permission(resource=PermissionResource.JOB_TITLES, action=PermissionAction.READ, description="Xem danh sách chức danh công việc"),
        Permission(resource=PermissionResource.JOB_TITLES, action=PermissionAction.UPDATE, description="Cập nhật chức danh công việc"),
        Permission(resource=PermissionResource.JOB_TITLES, action=PermissionAction.DELETE, description="Xóa chức danh công việc"),
        Permission(resource=PermissionResource.JOB_TITLES, action=PermissionAction.ASSIGN, description="Gán chức danh công việc cho người dùng"),
        
        # Resource: documents
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.CREATE, description="Tạo tài liệu mới"),
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.READ, description="Xem/đọc tài liệu"),
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.UPDATE, description="Cập nhật thông tin tài liệu"),
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.DELETE, description="Xóa tài liệu"),
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.UPLOAD, description="Tải lên tài liệu"),
        Permission(resource=PermissionResource.DOCUMENTS, action=PermissionAction.DOWNLOAD, description="Tải xuống tài liệu"),
        
        # Resource: department
        Permission(resource=PermissionResource.DEPARTMENTS, action=PermissionAction.CREATE, description="Tạo phòng ban mới"),
        Permission(resource=PermissionResource.DEPARTMENTS, action=PermissionAction.READ, description="Xem thông tin phòng ban"),
        Permission(resource=PermissionResource.DEPARTMENTS, action=PermissionAction.UPDATE, description="Cập nhật phòng ban"),
        Permission(resource=PermissionResource.DEPARTMENTS, action=PermissionAction.DELETE, description="Xóa phòng ban"),
        Permission(resource=PermissionResource.DEPARTMENTS, action=PermissionAction.ASSIGN, description="Gán phòng ban cho người dùng"),
        
        # Resource: conversation
        Permission(resource=PermissionResource.CONVERSATIONS, action=PermissionAction.CREATE, description="Tạo cuộc trò chuyện mới"),
        Permission(resource=PermissionResource.CONVERSATIONS, action=PermissionAction.READ, description="Xem lịch sử trò chuyện"),
        Permission(resource=PermissionResource.CONVERSATIONS, action=PermissionAction.UPDATE, description="Cập nhật thông tin cuộc trò chuyện"),
        Permission(resource=PermissionResource.CONVERSATIONS, action=PermissionAction.DELETE, description="Xóa cuộc trò chuyện"),
        Permission(resource=PermissionResource.CONVERSATIONS, action=PermissionAction.SEND, description="Gửi tin nhắn trong cuộc trò chuyện")
    ]
    db.add_all(other_permissions_data)
    await db.flush()

    # 5. Khởi tạo RolePermissions cho global admin
    global_admin_permissions = []
    for p in global_admin_permissions_data:
        global_admin_permissions.append(RolePermission(role_id=role.id, permission_id=p.id))
    
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
