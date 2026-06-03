-- BẢNG: departments
INSERT INTO departments (id, name, code, description) VALUES (1, 'Ban Giám đốc', 'BOD', 'Chức năng Ban Giám đốc');
INSERT INTO departments (id, name, code, description) VALUES (2, 'Phòng Nhân sự', 'HR', 'Chức năng Phòng Nhân sự');
INSERT INTO departments (id, name, code, description) VALUES (3, 'Phòng Công nghệ thông tin', 'IT', 'Chức năng Phòng Công nghệ thông tin');
INSERT INTO departments (id, name, code, description) VALUES (4, 'Phòng Kế toán', 'FIN', 'Chức năng Phòng Kế toán');
INSERT INTO departments (id, name, code, description) VALUES (5, 'Phòng Marketing', 'MKT', 'Chức năng Phòng Marketing');
INSERT INTO departments (id, name, code, description) VALUES (6, 'Phòng Hành chính', 'ADM', 'Chức năng Phòng Hành chính');

-- BẢNG: job_titles
INSERT INTO job_titles (id, title_name, code, description) VALUES (1, 'Giám đốc (CEO)', 'CEO', 'Mô tả công việc Giám đốc (CEO)');
INSERT INTO job_titles (id, title_name, code, description) VALUES (2, 'Trưởng phòng Nhân sự', 'HR_MGR', 'Mô tả công việc Trưởng phòng Nhân sự');
INSERT INTO job_titles (id, title_name, code, description) VALUES (3, 'Trưởng phòng IT', 'IT_MGR', 'Mô tả công việc Trưởng phòng IT');
INSERT INTO job_titles (id, title_name, code, description) VALUES (4, 'Chuyên viên Nhân sự', 'HR_SPEC', 'Mô tả công việc Chuyên viên Nhân sự');
INSERT INTO job_titles (id, title_name, code, description) VALUES (5, 'Kỹ sư phần mềm (Developer)', 'DEV', 'Mô tả công việc Kỹ sư phần mềm (Developer)');
INSERT INTO job_titles (id, title_name, code, description) VALUES (6, 'Nhân viên Kế toán', 'ACC', 'Mô tả công việc Nhân viên Kế toán');
INSERT INTO job_titles (id, title_name, code, description) VALUES (7, 'Chuyên viên Marketing', 'MKT_SPEC', 'Mô tả công việc Chuyên viên Marketing');
INSERT INTO job_titles (id, title_name, code, description) VALUES (8, 'Hành chính - Lễ tân', 'ADMIN', 'Mô tả công việc Hành chính - Lễ tân');

-- BẢNG: users (100 Records)
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (2, 'EMP-0002', 'vuong.tn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trác Nam Vượng', 3, 5, True, False, '2026-04-09 23:49:08', '2023-07-07 02:09:45', '2023-07-07 02:09:45');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (3, 'EMP-0003', 'y.lh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lã Hoàn Ý', 6, 8, True, False, '2025-03-17 15:24:40', '2023-01-16 02:55:14', '2023-01-16 02:55:14');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (4, 'EMP-0004', 'manh.pd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phí Ðan Mạnh', 5, 7, True, False, '2025-10-04 08:01:08', '2023-10-05 11:13:31', '2023-10-05 11:13:31');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (5, 'EMP-0005', 'phu.lk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lỗ Khởi Phú', 3, 5, True, False, '2024-02-14 10:36:40', '2023-02-03 02:03:16', '2023-02-03 02:03:16');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (6, 'EMP-0006', 'tu.tq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trương Quang Tụ', 3, 5, False, False, NULL, '2023-08-02 04:34:10', '2023-08-02 04:34:10');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (7, 'EMP-0007', 'dong.th@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Thái Hồ Ðồng', 5, 7, True, False, '2025-11-12 16:46:17', '2023-04-28 23:54:33', '2023-04-28 23:54:33');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (8, 'EMP-0008', 'nhuan.nd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nguyễn Ðình Nhuận', 3, 5, True, False, '2025-02-06 00:47:56', '2023-01-29 12:45:19', '2023-01-29 12:45:19');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (9, 'EMP-0009', 'dinh.kd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Kiều Ðông Ðịnh', 5, 7, True, False, '2024-09-16 23:14:22', '2023-10-16 22:22:02', '2023-10-16 22:22:02');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (10, 'EMP-0010', 'tri.cu@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Cù Uy Trí', 3, 5, True, False, '2024-11-27 07:35:23', '2023-09-12 02:19:18', '2023-09-12 02:19:18');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (11, 'EMP-0011', 'nhu.mt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Ma Tiểu Nhu', 4, 6, True, False, '2026-03-24 09:17:13', '2023-06-06 07:45:44', '2023-06-06 07:45:44');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (12, 'EMP-0012', 'ninh.th@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trịnh Hòa Ninh', 3, 5, True, False, '2025-09-21 06:24:38', '2023-10-20 05:44:03', '2023-10-20 05:44:03');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (13, 'EMP-0013', 'toan.cv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Châu Viễn Toản', 3, 5, False, False, NULL, '2023-02-11 12:53:24', '2023-02-11 12:53:24');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (14, 'EMP-0014', 'kiet.nn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nhữ Nam Kiệt', 1, 1, True, False, '2024-04-14 03:40:49', '2023-11-05 07:59:25', '2023-11-05 07:59:25');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (15, 'EMP-0015', 'kinh.vh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Vũ Hải Kính', 5, 7, True, False, '2024-05-31 15:24:09', '2023-05-16 07:51:55', '2023-05-16 07:51:55');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (16, 'EMP-0016', 'duyet.tv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trần Vương Duyệt', 6, 8, True, False, '2025-08-26 23:17:48', '2023-12-09 16:14:35', '2023-12-09 16:14:35');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (17, 'EMP-0017', 'tu.tc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trác Chính Tụ', 2, 2, True, False, '2025-09-07 03:46:34', '2023-04-25 09:17:55', '2023-04-25 09:17:55');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (18, 'EMP-0018', 'nghi.pc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phan Chính Nghị', 5, 7, True, False, '2024-05-30 16:27:49', '2023-08-18 00:55:39', '2023-08-18 00:55:39');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (19, 'EMP-0019', 'bac.tc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Thái Chuẩn Bắc', 3, 5, True, False, '2026-05-01 14:45:33', '2023-06-12 14:03:11', '2023-06-12 14:03:11');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (20, 'EMP-0020', 'lam.ll@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lã Lương Lam', 5, 7, True, False, '2024-12-19 09:01:38', '2023-03-04 17:06:56', '2023-03-04 17:06:56');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (21, 'EMP-0021', 'bao.td@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Thái Dương Bào', 3, 5, True, False, '2025-01-30 11:50:13', '2023-04-02 00:10:26', '2023-04-02 00:10:26');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (22, 'EMP-0022', 'hoang.ln@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'La Nguyễn Hoàng', 3, 5, True, False, '2024-02-22 17:25:03', '2023-10-01 05:03:23', '2023-10-01 05:03:23');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (23, 'EMP-0023', 'diep.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trác Thuận Diệp', 3, 5, True, False, '2023-11-13 09:18:08', '2023-08-30 22:51:32', '2023-08-30 22:51:32');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (24, 'EMP-0024', 'thuc.pm@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phan Mộng Thực', 3, 3, True, False, '2025-07-29 16:44:08', '2023-07-27 17:28:34', '2023-07-27 17:28:34');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (25, 'EMP-0025', 'quang.dk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đỗ Khuyến Quang', 3, 5, True, False, '2026-05-26 02:53:12', '2023-09-12 06:56:17', '2023-09-12 06:56:17');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (26, 'EMP-0026', 'huynh.tq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Thái Quảng Huỳnh', 3, 5, True, False, '2025-10-08 18:26:28', '2023-11-15 14:25:40', '2023-11-15 14:25:40');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (27, 'EMP-0027', 'thinh.qp@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Quách Phương Thịnh', 3, 5, True, False, '2024-11-24 06:27:02', '2023-04-13 07:39:25', '2023-04-13 07:39:25');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (28, 'EMP-0028', 'ngan.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tạ Tân Ngân', 5, 7, True, False, '2025-06-02 12:56:41', '2023-07-22 16:43:04', '2023-07-22 16:43:04');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (29, 'EMP-0029', 'tin.nt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nhữ Tân Tín', 3, 5, True, False, '2025-12-21 09:17:07', '2023-09-07 12:22:19', '2023-09-07 12:22:19');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (30, 'EMP-0030', 'giap.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tạ Thăng Giáp', 3, 5, True, False, '2026-01-10 20:33:05', '2023-06-10 10:10:36', '2023-06-10 10:10:36');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (31, 'EMP-0031', 'luan.un@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Ung Nghĩa Luận', 3, 5, True, False, '2025-01-03 12:45:02', '2023-11-05 22:40:32', '2023-11-05 22:40:32');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (32, 'EMP-0032', 'man.kb@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Kiều Bá Mẫn', 3, 3, True, False, '2026-03-22 12:48:10', '2023-09-17 01:03:27', '2023-09-17 01:03:27');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (33, 'EMP-0033', 'kien.nq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Ngô Quyết Kiện', 2, 4, True, False, '2024-11-27 11:34:26', '2023-09-07 11:04:39', '2023-09-07 11:04:39');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (34, 'EMP-0034', 'vu.tl@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tề Lương Vũ', 5, 7, True, False, '2024-06-08 15:00:29', '2023-08-25 04:28:24', '2023-08-25 04:28:24');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (35, 'EMP-0035', 'khanh.vc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Vũ Cát Khánh', 5, 7, True, False, '2024-05-15 08:01:11', '2023-01-06 10:09:22', '2023-01-06 10:09:22');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (36, 'EMP-0036', 'khoan.dh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đàm Hoài Khoan', 5, 7, True, False, '2023-04-03 09:48:16', '2023-02-10 11:44:37', '2023-02-10 11:44:37');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (37, 'EMP-0037', 'toan.ct@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Chế Tấn Toàn', 3, 5, True, False, '2024-10-14 20:07:12', '2023-09-14 04:40:46', '2023-09-14 04:40:46');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (38, 'EMP-0038', 'tri.pk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phí Khánh Trí', 3, 5, True, False, '2025-07-02 09:37:44', '2023-12-18 02:42:13', '2023-12-18 02:42:13');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (39, 'EMP-0039', 'phap.adv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Âu Dương Vạn Pháp', 3, 5, True, False, '2025-09-29 11:22:30', '2023-10-14 08:15:56', '2023-10-14 08:15:56');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (40, 'EMP-0040', 'dien.mh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Mã Hùng Ðiền', 3, 5, True, False, '2024-02-03 02:10:47', '2023-05-25 17:24:26', '2023-05-25 17:24:26');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (41, 'EMP-0041', 'anh.tq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tôn Quý Anh', 3, 5, True, False, '2025-07-04 21:58:40', '2023-05-22 18:57:05', '2023-05-22 18:57:05');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (42, 'EMP-0042', 'mien.th@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tăng Hạo Miên', 6, 8, False, False, NULL, '2023-03-24 03:14:04', '2023-03-24 03:14:04');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (43, 'EMP-0043', 'nang.cv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Châu Vương Năng', 2, 4, True, False, '2025-06-16 01:43:47', '2023-09-05 08:24:53', '2023-09-05 08:24:53');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (44, 'EMP-0044', 'ky.ld@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lăng Dương Kỳ', 3, 5, True, False, '2025-05-30 19:12:21', '2023-06-28 09:14:44', '2023-06-28 09:14:44');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (45, 'EMP-0045', 'thuc.nh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nông Huy Thực', 3, 5, True, False, '2025-05-28 09:34:56', '2023-05-11 05:39:57', '2023-05-11 05:39:57');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (46, 'EMP-0046', 'vi.ml@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Mâu Liên Vĩ', 2, 4, False, False, NULL, '2023-03-15 20:42:21', '2023-03-15 20:42:21');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (47, 'EMP-0047', 'man.ld@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lại Ðắc Mẫn', 5, 7, True, False, '2024-10-01 05:14:26', '2023-08-09 18:30:22', '2023-08-09 18:30:22');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (48, 'EMP-0048', 'giang.tc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tăng Cát Giang', 3, 5, True, False, '2025-11-07 14:04:30', '2023-07-05 12:25:48', '2023-07-05 12:25:48');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (49, 'EMP-0049', 'quan.adq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Âu Dương Quảng Quân', 5, 7, True, False, '2025-09-28 16:17:44', '2023-04-16 12:54:38', '2023-04-16 12:54:38');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (50, 'EMP-0050', 'sang.ld@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lỗ Ðắc Sang', 3, 5, True, False, '2026-02-19 23:39:27', '2023-07-14 13:50:56', '2023-07-14 13:50:56');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (51, 'EMP-0051', 'sang.nk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Ngô Khương Sang', 3, 5, True, False, '2024-08-08 02:26:36', '2023-02-22 02:29:11', '2023-02-22 02:29:11');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (52, 'EMP-0052', 'lien.lm@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lã Mạnh Liên', 3, 5, True, False, '2024-07-09 09:04:04', '2023-10-27 03:24:16', '2023-10-27 03:24:16');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (53, 'EMP-0053', 'sang.td@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tào Dũng Sáng', 3, 5, True, False, '2026-05-03 04:58:08', '2023-07-15 12:42:39', '2023-07-15 12:42:39');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (54, 'EMP-0054', 'xuan.dt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Dương Trúc Xuân', 3, 5, False, False, NULL, '2023-08-04 22:26:53', '2023-08-04 22:26:53');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (55, 'EMP-0055', 'hoc.kn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Khương Ngọc Học', 3, 5, True, False, '2026-05-03 05:42:35', '2023-05-21 09:40:38', '2023-05-21 09:40:38');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (56, 'EMP-0056', 'bao.tv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tôn Viễn Bảo', 3, 5, True, False, '2025-07-07 04:30:29', '2023-05-16 07:55:16', '2023-05-16 07:55:16');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (57, 'EMP-0057', 'an.nph@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nguỵ Phước Hải An', 3, 5, True, False, '2025-05-28 08:31:01', '2023-05-01 08:59:25', '2023-05-01 08:59:25');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (58, 'EMP-0058', 'quynh.th@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tề Hồng Quỳnh', 3, 5, True, False, '2026-02-16 12:44:31', '2023-03-15 14:46:26', '2023-03-15 14:46:26');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (59, 'EMP-0059', 'kiet.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trác Tiền Kiệt', 3, 5, True, False, '2025-04-21 02:40:51', '2023-01-25 06:09:46', '2023-01-25 06:09:46');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (60, 'EMP-0060', 'khoat.ld@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lương Ðịnh Khoát', 3, 5, True, False, '2025-01-04 10:38:59', '2023-05-23 03:33:11', '2023-05-23 03:33:11');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (61, 'EMP-0061', 'thoi.nd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nguỵ Dân Thời', 2, 4, True, False, '2026-01-11 15:12:33', '2023-02-05 18:39:49', '2023-02-05 18:39:49');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (62, 'EMP-0062', 'loi.tq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trương Quyết Lợi', 3, 5, True, False, '2025-10-25 22:29:18', '2023-11-09 16:05:41', '2023-11-09 16:05:41');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (63, 'EMP-0063', 'cong.dv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đỗ Việt Công', 3, 5, True, False, '2024-10-21 03:58:41', '2023-02-11 12:40:04', '2023-02-11 12:40:04');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (64, 'EMP-0064', 'tan.lt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lương Tấn Tấn', 3, 5, True, False, '2024-11-25 13:34:52', '2023-08-29 14:04:05', '2023-08-29 14:04:05');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (65, 'EMP-0065', 'hiep.ut@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Ung Tiến Hiệp', 6, 8, True, False, '2026-04-15 12:02:01', '2023-12-30 18:15:19', '2023-12-30 18:15:19');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (66, 'EMP-0066', 'tuong.mc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Mâu Chính Tường', 3, 5, True, False, '2023-05-31 12:07:23', '2023-04-10 18:28:03', '2023-04-10 18:28:03');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (67, 'EMP-0067', 'tho.cn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Chế Nam Thọ', 3, 5, True, False, '2026-04-04 19:47:21', '2023-02-25 18:19:45', '2023-02-25 18:19:45');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (68, 'EMP-0068', 'ky.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Triệu Tôn Kỳ', 6, 8, True, False, '2024-12-01 18:52:29', '2023-05-11 13:21:14', '2023-05-11 13:21:14');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (69, 'EMP-0069', 'nhan.kn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Kiều Niệm Nhạn', 5, 7, True, False, '2025-09-23 14:40:36', '2023-09-04 11:01:18', '2023-09-04 11:01:18');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (70, 'EMP-0070', 'yen.adh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Âu Dương Hào Yên', 2, 4, False, False, NULL, '2023-03-09 11:59:14', '2023-03-09 11:59:14');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (71, 'EMP-0071', 'liem.nt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nhữ Tất Liêm', 6, 8, True, False, '2025-07-04 08:44:45', '2023-08-06 19:14:38', '2023-08-06 19:14:38');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (72, 'EMP-0072', 'hoa.tn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Thái Nghĩa Hòa', 3, 5, True, False, '2025-09-20 20:10:32', '2023-03-05 18:04:39', '2023-03-05 18:04:39');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (73, 'EMP-0073', 'an.da@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đặng Ân Ân', 3, 5, True, False, '2024-09-24 15:52:51', '2023-12-03 07:00:55', '2023-12-03 07:00:55');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (74, 'EMP-0074', 'tu.kn@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Khương Niệm Từ', 5, 7, True, False, '2023-12-18 05:21:36', '2023-04-04 16:11:30', '2023-04-04 16:11:30');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (75, 'EMP-0075', 'tu.hd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Hồ Ðinh Tụ', 3, 5, True, False, '2026-02-09 18:52:44', '2023-02-12 08:31:26', '2023-02-12 08:31:26');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (76, 'EMP-0076', 'dinh.nt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Nhan Tài Ðịnh', 4, 6, True, False, '2023-06-05 18:22:19', '2023-03-26 17:50:08', '2023-03-26 17:50:08');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (77, 'EMP-0077', 'thuy.tp@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Tôn Phục Thủy', 3, 5, True, False, '2025-01-27 16:37:28', '2023-05-28 05:30:38', '2023-05-28 05:30:38');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (78, 'EMP-0078', 'nhu.vh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Võ Hoàn Nhu', 6, 8, True, False, '2025-04-30 03:46:28', '2023-02-03 10:26:21', '2023-02-03 10:26:21');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (79, 'EMP-0079', 'liem.ht@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Hồ Tài Liêm', 3, 5, True, False, '2024-03-30 05:03:04', '2023-04-03 19:49:53', '2023-04-03 19:49:53');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (80, 'EMP-0080', 'ngon.ld@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'La Ðông Ngôn', 3, 5, True, False, '2024-02-29 10:22:48', '2023-04-05 03:56:49', '2023-04-05 03:56:49');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (81, 'EMP-0081', 'vuong.vk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Võ Khai Vượng', 3, 5, True, False, '2023-07-07 00:43:37', '2023-01-04 04:27:39', '2023-01-04 04:27:39');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (82, 'EMP-0082', 'thac.th@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trịnh Hoàn Thạc', 3, 5, True, False, '2025-07-09 01:40:57', '2023-08-21 11:06:38', '2023-08-21 11:06:38');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (83, 'EMP-0083', 'su.lk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lăng Kiên Sử', 4, 6, True, False, '2024-01-28 16:30:13', '2023-03-23 14:29:50', '2023-03-23 14:29:50');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (84, 'EMP-0084', 'vy.pt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phùng Thiên Vỹ', 3, 5, True, False, '2024-05-30 07:45:03', '2023-11-01 23:54:34', '2023-11-01 23:54:34');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (85, 'EMP-0085', 'an.qt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Quách Tâm Ẩn', 4, 6, True, False, '2024-12-17 11:39:17', '2023-03-14 17:15:45', '2023-03-14 17:15:45');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (86, 'EMP-0086', 'trieu.uq@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Uông Quang Triệu', 4, 6, True, False, '2024-12-28 04:59:00', '2023-01-22 15:13:33', '2023-01-22 15:13:33');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (87, 'EMP-0087', 'tu.lt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Lỗ Thịnh Tú', 3, 5, True, False, '2026-02-01 16:43:08', '2023-11-11 02:44:09', '2023-11-11 02:44:09');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (88, 'EMP-0088', 'tung.tb@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trương Bữu Tùng', 3, 5, True, False, '2025-11-19 12:18:48', '2023-10-06 08:55:30', '2023-10-06 08:55:30');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (89, 'EMP-0089', 'luat.mk@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Mã Kim Luật', 3, 5, True, False, '2024-09-13 10:00:25', '2023-05-15 11:56:50', '2023-05-15 11:56:50');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (90, 'EMP-0090', 'thuyet.pt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Phan Tạ Thuyết', 6, 8, True, False, '2025-11-22 01:57:58', '2023-10-19 17:40:12', '2023-10-19 17:40:12');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (91, 'EMP-0091', 'long.bbb@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Bành Bách Bảo Long', 6, 8, True, False, '2025-02-25 10:54:05', '2023-09-07 22:11:23', '2023-09-07 22:11:23');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (92, 'EMP-0092', 'khanh.db@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đồng Bách Khanh', 3, 5, True, False, '2024-05-24 03:01:29', '2023-12-24 08:27:14', '2023-12-24 08:27:14');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (93, 'EMP-0093', 'nang.dt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đoàn Từ Năng', 3, 5, True, False, '2025-08-24 23:34:50', '2023-11-06 20:17:08', '2023-11-06 20:17:08');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (94, 'EMP-0094', 'loc.mv@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Mai Vĩnh Lộc', 2, 2, True, False, '2024-07-23 02:08:08', '2023-09-05 00:53:21', '2023-09-05 00:53:21');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (95, 'EMP-0095', 'tue.dd@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đoàn Ðắc Tuệ', 6, 8, True, False, '2025-06-27 00:42:48', '2023-03-17 07:01:18', '2023-03-17 07:01:18');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (96, 'EMP-0096', 'tiep.ch@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Cao Hùng Tiếp', 3, 5, False, False, NULL, '2023-09-25 17:05:07', '2023-09-25 17:05:07');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (97, 'EMP-0097', 'sam.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trác Thụy Sâm', 3, 5, True, False, '2025-04-10 01:25:52', '2023-03-28 01:48:51', '2023-03-28 01:48:51');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (98, 'EMP-0098', 'nguyen.dh@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Đặng Hạnh Nguyên', 3, 5, True, False, '2026-01-11 04:32:19', '2023-11-13 02:17:26', '2023-11-13 02:17:26');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (99, 'EMP-0099', 'co.tt@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Trần Thụ Cơ', 3, 5, True, False, '2026-03-06 20:16:07', '2023-12-29 18:13:35', '2023-12-29 18:13:35');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (100, 'EMP-0100', 'tinh.hc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Hứa Chuẩn Tính', 5, 7, True, False, '2025-11-20 11:14:33', '2023-08-29 03:28:02', '2023-08-29 03:28:02');
INSERT INTO users (id, employee_code, email, password, full_name, department_id, job_title_id, is_active, is_deleted, last_login, created_at, updated_at) 
VALUES (101, 'EMP-0101', 'du.hc@company.local', '$argon2id$v=19$m=65536,t=3,p=4$V5ot5GGClLdK7LY7Cr4u+g$8ZpRFsV076ez1VkD0bnVOsg0pqsZNUXneZH8mRdQ7cc', 'Huỳnh Cường Du', 3, 5, False, False, NULL, '2023-05-22 02:04:36', '2023-05-22 02:04:36');

-- Cập nhật manager_id cho departments (Optional)
-- Lý ngẫu nhiên các user thuộc phòng ban đó làm trưởng phòng
UPDATE departments SET manager_id = (SELECT id FROM users WHERE users.department_id = departments.id AND users.job_title_id IN (1, 2, 3) LIMIT 1);