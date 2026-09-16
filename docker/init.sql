-- Automatically initialize MySQL database for Telegram Attendance System
CREATE DATABASE IF NOT EXISTS `telegram_attendance_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `telegram_attendance_db`.* TO 'root'@'%';
FLUSH PRIVILEGES;

