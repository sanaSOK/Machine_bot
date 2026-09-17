USE telegram_attendance_db;

UPDATE attendances a
JOIN staffs s ON a.staff_id = s.id
SET a.branch_id = COALESCE(s.branch_id, 1)
WHERE a.branch_id IS NULL;

UPDATE attendances SET branch_id = 1 WHERE branch_id IS NULL;

ALTER TABLE attendances 
  MODIFY COLUMN branch_id INT NOT NULL,
  ADD CONSTRAINT fk_attendances_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  ADD INDEX idx_attendances_branch_created (branch_id, created_at);
