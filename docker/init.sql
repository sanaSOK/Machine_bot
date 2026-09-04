-- Automatically initialize MySQL databases for Telegram Attendance System
CREATE DATABASE IF NOT EXISTS `telegram_app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `super_admin_attendances_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `telegram_app`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `super_admin_attendances_db`.* TO 'root'@'%';
FLUSH PRIVILEGES;
