import asyncio
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import uuid_utils
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy import text
from unidecode import unidecode
from vnfaker import VNFaker

# Ensure backend root directory is in sys.path
SEEDS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SEEDS_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv(BACKEND_DIR / ".env")

from app.db.session import AsyncSessionLocal
from app.utils.auth import hash_password

fake = Faker('vi_VN')

# Default password hash for seeded users
default_password = "P@ssword123"
hashed_password = hash_password(default_password)


def random_date(start: datetime, end: datetime) -> datetime:
    delta = int((end - start).total_seconds())
    if delta <= 0:
        return start
    return start + timedelta(seconds=random.randint(0, delta))


def generate_email(full_name: str, existing_emails: set) -> str:
    full_name_clean = unidecode(full_name)
    parts = full_name_clean.strip().lower().split()
    if not parts:
        base_email = "user@company.local"
    elif len(parts) == 1:
        base_email = f"{parts[0]}@company.local"
    else:
        first_name = parts[-1]
        initials = ''.join(p[0] for p in parts[:-1])
        base_email = f"{first_name}.{initials}@company.local"

    email = base_email
    counter = 1
    while email in existing_emails:
        prefix, domain = base_email.split("@")
        email = f"{prefix}{counter}@{domain}"
        counter += 1
    existing_emails.add(email)
    return email


async def main():
    print("=" * 60)
    print("  USER SEED SCRIPT (Importing Users to DB)")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        # 1. Fetch existing departments & job titles from DB
        dept_res = await session.execute(
            text("SELECT id, tenant_id, name, code FROM departments WHERE is_deleted = false")
        )
        depts = dept_res.mappings().all()

        job_res = await session.execute(
            text("SELECT id, title_name, code FROM job_titles WHERE is_deleted = false")
        )
        jobs = job_res.mappings().all()

        if not depts:
            print("[ERROR] Không tìm thấy department nào trong DB! Vui lòng chạy seed_data trước.")
            return

        if not jobs:
            print("[ERROR] Không tìm thấy job_title nào trong DB! Vui lòng chạy seed_data trước.")
            return

        print(f"-> Tìm thấy {len(depts)} departments và {len(jobs)} job titles trong DB.")

        # Fetch existing emails from DB to avoid duplicate email constraint
        existing_email_res = await session.execute(
            text("SELECT email FROM users WHERE is_deleted = false")
        )
        existing_emails = {row[0] for row in existing_email_res.fetchall()}

        # 2. Generate 100 fake users
        start_date = datetime(2023, 1, 1, tzinfo=timezone.utc)
        end_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)

        users_data = []
        sql_statements = ["-- BẢNG: users (100 Records)"]

        for i in range(2, 102):
            vnfaker = VNFaker()
            user_id = str(uuid_utils.uuid7())
            employee_code = f"EMP-{i:04d}"
            full_name = vnfaker.fullname()
            email = generate_email(full_name, existing_emails)

            dept = random.choice(depts)
            job = random.choice(jobs)

            department_id = dept["id"]
            tenant_id = dept.get("tenant_id") or "019fa6e1-01f9-7272-82d7-a9e19b28456a"
            job_title_id = job["id"]

            is_active = True if random.random() > 0.05 else False
            is_deleted = False

            created_at = random_date(start_date, end_date)
            updated_at = created_at
            last_login = random_date(created_at, now) if is_active else None

            users_data.append({
                "id": user_id,
                "employee_code": employee_code,
                "email": email,
                "password": hashed_password,
                "full_name": full_name,
                "department_id": department_id,
                "job_title_id": job_title_id,
                "tenant_id": tenant_id,
                "is_active": is_active,
                "is_deleted": is_deleted,
                "last_login": last_login,
                "created_at": created_at,
                "updated_at": updated_at,
            })

            last_login_str = f"'{last_login.strftime('%Y-%m-%d %H:%M:%S')}'" if last_login else "NULL"
            sql_statements.append(
                f"INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, tenant_id, is_active, is_deleted, last_login, created_at, updated_at) "
                f"VALUES ('{user_id}', '{employee_code}', '{email}', '{hashed_password}', '{full_name}', '{department_id}', '{job_title_id}', '{tenant_id}', {is_active}, {is_deleted}, {last_login_str}, '{created_at.strftime('%Y-%m-%d %H:%M:%S')}', '{updated_at.strftime('%Y-%m-%d %H:%M:%S')}') ON CONFLICT DO NOTHING;"
            )

        # 3. Insert users into DB
        stmt = text("""
            INSERT INTO users
                (id, employee_code, email, password, full_name, department_id, job_title_id, tenant_id, is_active, is_deleted, last_login, created_at, updated_at)
            VALUES
                (:id, :employee_code, :email, :password, :full_name, :department_id, :job_title_id, :tenant_id, :is_active, :is_deleted, :last_login, :created_at, :updated_at)
            ON CONFLICT DO NOTHING
        """)

        await session.execute(stmt, users_data)
        await session.commit()
        print(f"[OK] Đã import thành công {len(users_data)} users vào database!")

        # 4. Save SQL file for backup / reference
        sql_file = SEEDS_DIR / "generate_user_seed.sql"
        with open(sql_file, "w", encoding="utf-8") as f:
            f.write("\n".join(sql_statements))
        print(f"[OK] Đã ghi câu lệnh SQL ra file: {sql_file}")

        print("=" * 60)
        print("  USER SEED HOÀN TẤT [DONE]")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())