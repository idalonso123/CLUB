-- =============================================
-- SCRIPT SQL COMPLETO PARA CREAR TABLAS DE BACKUP
-- Ejecutar en MySQL para que funcione la pestaña de copias de seguridad
-- =============================================

-- Crear tabla backup_config si no existe
CREATE TABLE IF NOT EXISTS `backup_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` longtext NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key_unique` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla backup_logs si no existe
CREATE TABLE IF NOT EXISTS `backup_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `backup_type` enum('database','files','full','cleanup','restore') NOT NULL,
  `status` enum('in_progress','success','failed') NOT NULL DEFAULT 'in_progress',
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `compressed` tinyint(1) NOT NULL DEFAULT 0,
  `encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `tables_count` int(11) DEFAULT NULL,
  `records_count` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_type` (`backup_type`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Limpiar tablas existentes (opcional, descomentar si es necesario)
-- TRUNCATE TABLE backup_config;
-- TRUNCATE TABLE backup_logs;

-- Insertar configuración por defecto (usar REPLACE para actualizar si ya existe)
REPLACE INTO `backup_config` (`config_key`, `config_value`, `description`) VALUES
('system_enabled', 'true', 'Habilitar/deshabilitar el sistema de backup'),
('database_backup', '{"enabled":true,"schedule":"daily","time":"02:00","dayOfWeek":1,"dayOfMonth":1,"retention":30,"compression":"gzip","includeStoredProcedures":true,"includeTriggers":true,"includeEvents":false,"singleTransaction":true,"addDropStatements":true}', 'Configuracion de backup de base de datos'),
('files_backup', '{"enabled":true,"schedule":"weekly","time":"03:00","dayOfWeek":0,"dayOfMonth":1,"retention":14,"compression":"gzip","includeUploads":true,"includeConfig":true,"includeLogs":false,"excludePatterns":["*.log","node_modules",".git"]}', 'Configuracion de backup de archivos'),
('storage_local', '{"enabled":true,"path":"/backups","maxSize":5000}', 'Configuracion de almacenamiento local'),
('storage_ftp', '{"enabled":false,"host":"","port":21,"username":"","password":"","remotePath":"/backups","passiveMode":true}', 'Configuracion de almacenamiento FTP'),
('storage_s3', '{"enabled":false,"accessKey":"","secretKey":"","bucket":"","region":"eu-west-1","endpoint":""}', 'Configuracion de almacenamiento S3'),
('storage_google_drive', '{"enabled":false,"credentials":"","folderId":""}', 'Configuracion de Google Drive'),
('encryption', '{"enabled":false,"password":""}', 'Configuracion de cifrado'),
('notifications', '{"enabled":true,"emailOnSuccess":false,"emailOnFailure":true,"emailRecipients":[],"webhookUrl":"","webhookEvents":[]}', 'Configuracion de notificaciones'),
('maintenance', '{"autoCleanup":true,"cleanupRetention":30,"verifyIntegrity":true,"testRestoration":false}', 'Configuracion de mantenimiento');

-- Crear tabla backup_scheduled si no existe (para backups automáticos programados)
CREATE TABLE IF NOT EXISTS `backup_scheduled` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `backup_type` enum('database','files','full') NOT NULL DEFAULT 'full',
  `schedule_type` enum('hourly','daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  `time` time DEFAULT '02:00:00',
  `day_of_week` tinyint(1) DEFAULT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
  `day_of_month` tinyint(2) DEFAULT NULL COMMENT '1-31',
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `last_run` datetime DEFAULT NULL,
  `next_run` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `enabled` (`enabled`),
  KEY `schedule_type` (`schedule_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar programaciones por defecto
INSERT INTO `backup_scheduled` (`name`, `backup_type`, `schedule_type`, `time`, `day_of_week`, `day_of_month`, `enabled`) VALUES
('Backup Diario Completo', 'full', 'daily', '02:00:00', NULL, NULL, 1),
('Backup Semanal Archivos', 'files', 'weekly', '03:00:00', 0, NULL, 1);

-- Verificar que todo se creó correctamente
SELECT 'Tabla backup_config creada correctamente' AS status;
SELECT COUNT(*) AS total_config FROM backup_config;

SELECT 'Tabla backup_logs creada correctamente' AS status;
SELECT COUNT(*) AS total_logs FROM backup_logs;

-- Mostrar toda la configuración
SELECT '=== CONFIGURACIÓN DE BACKUP ===' AS info;
SELECT config_key, description FROM backup_config ORDER BY id;
