CREATE DATABASE IF NOT EXISTS `telegram_attendance_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE telegram_attendance_db;

CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NULL DEFAULT NULL,
    phone VARCHAR(20) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    admin_id INT NULL UNIQUE,
    created_by INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_branches_created_by (created_by),
    INDEX idx_branches_admin_id (admin_id),
    CONSTRAINT fk_branches_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_url VARCHAR(255) NULL,
  role TINYINT NOT NULL DEFAULT 1, -- 1 = Super-Admin, 2 = Admin
  branch_id INT NULL UNIQUE,
  telegram_chat_id BIGINT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1, -- 1 = active, 2 = inactive
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token_hash VARCHAR(255) NULL,
  verification_expires DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_verification_token_hash (verification_token_hash),
  INDEX idx_users_telegram_chat_id (telegram_chat_id),
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200) NULL DEFAULT NULL,
    color VARCHAR(32) NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_departments_branch_id (branch_id),
    CONSTRAINT fk_departments_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL DEFAULT 1,
  branch_id INT NOT NULL DEFAULT 1,
  fullname VARCHAR(100) NOT NULL,
  telegram_chat_id BIGINT NULL UNIQUE,
  role TINYINT NOT NULL DEFAULT 1, -- 1 = default staff, and other example 2 = student
  phone VARCHAR(20) NULL,
  profile_url VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_department_id (department_id),
  INDEX idx_telegram_chat_id (telegram_chat_id),
  INDEX idx_staffs_branch_id (branch_id),
  CONSTRAINT fk_staffs_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL DEFAULT 1,
    staff_id INT NOT NULL,
    action ENUM('CHECK_IN', 'CHECK_OUT') NOT NULL,
    photo_url VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL DEFAULT NULL,
    longitude DECIMAL(11, 8) NULL DEFAULT NULL,
    address TEXT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attendances_branch_created (branch_id, created_at),
    INDEX idx_attendance_staff_id (staff_id),
    CONSTRAINT fk_attendances_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendances_staff FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    department_id INT NOT NULL,
    work_start_time VARCHAR(16) NOT NULL DEFAULT '08:00',
    work_end_time VARCHAR(16) NOT NULL DEFAULT '17:00',
    grace_period_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_works_staff_dept (staff_id, department_id),
    INDEX idx_works_staff_id (staff_id),
    INDEX idx_works_department_id (department_id),
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Root Super Admin (email: superadmin@eroxii.com, password: Admin@1234)
INSERT INTO users (id, fullname, email, password, role, is_active, is_verified)
VALUES (
  1,
  'System Super Admin',
  'superadmin@eroxii.com',
  'd7b7a12fd80c02acd85f5c6be7cb58f5:f0eb765002dc24c4fd0d92ae0a902826b9143ffa67a38747e70f8e68551caf595798089413eba2f9bc165857c47fa820244645892cd3a32275cb0178386e79c3',
  1,
  1,
  1
)
ON DUPLICATE KEY UPDATE email=email;

-- Insert default Head Office Branch
INSERT INTO branches (id, name, address, phone, is_active, created_by)
VALUES (1, 'Head Office', 'Phnom Penh, Cambodia', '+855 23 000 000', 1, 1)
ON DUPLICATE KEY UPDATE name=name;

-- Insert default department for staffs
INSERT INTO departments (id, branch_id, name, description, color)
VALUES (1, 1, 'General', 'General Department', '#6366f1')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default staff for General department
INSERT INTO staffs (id, department_id, branch_id, fullname, role, is_active)
VALUES (1, 1, 1, 'System Staff', 1, 1)
ON DUPLICATE KEY UPDATE fullname=fullname;

-- Insert default work shift for staff in department (08:00 - 17:00, grace 15 mins)
INSERT INTO works (id, staff_id, department_id, work_start_time, work_end_time, grace_period_minutes)
VALUES (1, 1, 1, '08:00', '17:00', 15)
ON DUPLICATE KEY UPDATE 
  work_start_time = VALUES(work_start_time),
  work_end_time = VALUES(work_end_time),
  grace_period_minutes = VALUES(grace_period_minutes);