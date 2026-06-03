import random
from faker import Faker
from vnfaker import VNFaker
from datetime import datetime, timedelta
from pwdlib import PasswordHash
from unidecode import unidecode

password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

# Khởi tạo Faker với ngôn ngữ tiếng Việt
fake = Faker('vi_VN')

# Định nghĩa dữ liệu Phòng ban (Departments)
departments = [
    {"id": 1, "name": "Ban Giám đốc", "code": "BOD"},
    {"id": 2, "name": "Phòng Nhân sự", "code": "HR"},
    {"id": 3, "name": "Phòng Công nghệ thông tin", "code": "IT"},
    {"id": 4, "name": "Phòng Kế toán", "code": "FIN"},
    {"id": 5, "name": "Phòng Marketing", "code": "MKT"},
    {"id": 6, "name": "Phòng Hành chính", "code": "ADM"}
]

# Định nghĩa dữ liệu Chức danh (Job Titles) kèm Department tương ứng và số lượng mong muốn
# Tổng số lượng (count) = 100
job_titles = [
    {"id": 1, "title_name": "Giám đốc (CEO)", "code": "CEO", "dept_id": 1, "count": 1},
    {"id": 2, "title_name": "Trưởng phòng Nhân sự", "code": "HR_MGR", "dept_id": 2, "count": 2},
    {"id": 3, "title_name": "Trưởng phòng IT", "code": "IT_MGR", "dept_id": 3, "count": 2},
    {"id": 4, "title_name": "Chuyên viên Nhân sự", "code": "HR_SPEC", "dept_id": 2, "count": 5},
    {"id": 5, "title_name": "Kỹ sư phần mềm (Developer)", "code": "DEV", "dept_id": 3, "count": 60},
    {"id": 6, "title_name": "Nhân viên Kế toán", "code": "ACC", "dept_id": 4, "count": 5},
    {"id": 7, "title_name": "Chuyên viên Marketing", "code": "MKT_SPEC", "dept_id": 5, "count": 15},
    {"id": 8, "title_name": "Hành chính - Lễ tân", "code": "ADMIN", "dept_id": 6, "count": 10}
]

# Chuẩn bị danh sách chức danh cho 100 người dùng
user_job_assignments = []
for job in job_titles:
    user_job_assignments.extend([(job["id"], job["dept_id"])] * job["count"])

# Trộn ngẫu nhiên danh sách để phân bổ ngẫu nhiên khi insert
random.shuffle(user_job_assignments)

# Tạo password hash mặc định ('password123')
default_password = "P@ssword123"
hashed_password = hash_password(default_password)

def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

start_date = datetime(2023, 1, 1)
end_date = datetime(2024, 1, 1)


sql_statements = []

# 1. Sinh câu lệnh INSERT cho bảng departments
sql_statements.append("-- BẢNG: departments")
for dept in departments:
    statement = f"INSERT INTO departments (id, name, code, description) VALUES ({dept['id']}, '{dept['name']}', '{dept['code']}', 'Chức năng {dept['name']}');"
    sql_statements.append(statement)


# 2. Sinh câu lệnh INSERT cho bảng job_titles
sql_statements.append("\n-- BẢNG: job_titles")
for job in job_titles:
    statement = f"INSERT INTO job_titles (id, title_name, code, description) VALUES ({job['id']}, '{job['title_name']}', '{job['code']}', 'Mô tả công việc {job['title_name']}');"
    sql_statements.append(statement)

def generate_email(full_name: str) -> str:
    full_name = unidecode(full_name)

    parts = full_name.strip().lower().split()

    if len(parts) == 1:
        return parts[0]

    first_name = parts[-1]           # nam
    initials = ''.join(p[0] for p in parts[:-1])  # nv

    email = f"{first_name}.{initials}@company.local"
    return email

# 3. Sinh câu lệnh INSERT cho bảng users
sql_statements.append("\n-- BẢNG: users (100 Records)")
for i in range(2, 102):
    vnfaker = VNFaker()

    user_id = i
    employee_code = f"EMP-{i:04d}"
    full_name = vnfaker.fullname()
    
    email = generate_email(full_name)
    
    job_title_id, department_id = user_job_assignments[i-2]
    
    is_active = True if random.random() > 0.05 else False
    is_deleted = False
    
    created_at = random_date(start_date, end_date)
    updated_at = created_at
    last_login_at = random_date(created_at, datetime.now()) if is_active else 'NULL'
    
    last_login_str = f"'{last_login_at.strftime('%Y-%m-%d %H:%M:%S')}'" if last_login_at != 'NULL' else "NULL"
    
    sql = f"""INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES ({user_id}, '{employee_code}', '{email}', '{hashed_password}', '{full_name}', {department_id}, {job_title_id}, {is_active}, {is_deleted}, {last_login_str}, '{created_at.strftime('%Y-%m-%d %H:%M:%S')}', '{updated_at.strftime('%Y-%m-%d %H:%M:%S')}');"""
    
    sql_statements.append(sql)

sql_statements.append("\n-- Cập nhật manager_id cho departments (Optional)")
sql_statements.append("-- Lý ngẫu nhiên các user thuộc phòng ban đó làm trưởng phòng")
sql_statements.append("UPDATE departments SET manager_id = (SELECT id FROM users WHERE users.department_id = departments.id AND users.job_title_id IN (1, 2, 3) LIMIT 1);")

sql_contents = "\n".join(sql_statements)
output_file = 'D:\luanvan\demo\hr_assistant\seeds\generate_user_seed.sql'

with open(output_file, 'w', encoding='utf-8') as file:
    file.write(sql_contents)

print(f"SQL statements have been written to {output_file}")