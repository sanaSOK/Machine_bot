USE telegram_attendance_db;

CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NULL DEFAULT NULL,
    phone VARCHAR(20) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_branches_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_branches_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1:1
ALTER TABLE users
  ADD COLUMN branch_id INT NULL AFTER role,
  ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  ADD UNIQUE KEY uq_users_branch_id (branch_id);

-- 1:N
ALTER TABLE departments
  ADD COLUMN branch_id INT NULL AFTER id,
  ADD CONSTRAINT fk_departments_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  ADD INDEX idx_departments_branch_id (branch_id);


ALTER TABLE staffs
  ADD COLUMN branch_id INT NULL AFTER department_id,
  ADD CONSTRAINT fk_staffs_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  ADD INDEX idx_staffs_branch_id (branch_id);
