-- Automatically create databases if they do not exist
CREATE DATABASE IF NOT EXISTS `telegram_attendance_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE telegram_attendance_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_url VARCHAR(255) NULL,
  role TINYINT NOT NULL DEFAULT 1, -- 1 = Super-Admin, 2 = Admin
  is_active TINYINT(1) NOT NULL DEFAULT 1, -- 1 = active, 2 = inactive
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token_hash VARCHAR(255) NULL,
  verification_expires DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_verification_token_hash (verification_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200) NULL DEFAULT NULL,
    color VARCHAR(32) NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL DEFAULT 1,
  fullname VARCHAR(100) NOT NULL,
  telegram_chat_id BIGINT NULL UNIQUE,
  role TINYINT NOT NULL DEFAULT 1, -- 1 = default staff, and othe example 2 = student
  phone VARCHAR(20) NULL,
  profile_url VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_department_id (department_id),
  INDEX idx_telegram_chat_id (telegram_chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    action ENUM('CHECK_IN', 'CHECK_OUT') NOT NULL,
    photo_url VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL DEFAULT NULL,
    longitude DECIMAL(11, 8) NULL DEFAULT NULL,
    address TEXT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attendance_staff_id (staff_id),
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    department_id INT NOT NULL DEFAULT 1,
    work_start_time VARCHAR(16) NOT NULL DEFAULT '08:00',
    work_end_time VARCHAR(16) NOT NULL DEFAULT '17:00',
    grace_period_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default department for staffs
INSERT INTO departments (id, name, description, color)
VALUES (1, 'General', 'General Department', '#6366f1')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default Root Super Admin (email: superadmin@eroxii.com, password: admin1234)
INSERT INTO users (id, fullname, email, password, role, is_active, is_verified)
VALUES (
  1,
  'System Super Admin',
  'superadmin@eroxii.com',
  'b0ca0571879a79db48171ee227d78227:66694463a4baf39526f8fb39e32d7743c11d89cb70eb4f7bb3427acd017368f48d72534e085e06f7c0ecba0d07e1fc8c43d5b3bdea7ceb44430a34ac2cefcd25',
  1,
  1,
  1
)
ON DUPLICATE KEY UPDATE email=email;