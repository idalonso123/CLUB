-- Script para verificar y corregir tablas de backup
-- Ejecutar en MySQL: mysql -u usuario -p base_de_datos < fix_backup_tables.sql

-- Verificar si las tablas existen
SELECT 'Verificando tablas de backup...' as status;

-- Verificar backup_config
SELECT 
    COUNT(*) as total_registros,
    GROUP_CONCAT(config_key) as claves_config
FROM backup_config;

-- Verificar backup_logs
SELECT 
    COUNT(*) as total_registros
FROM backup_logs;

-- Insertar configuración por defecto si no existe
INSERT IGNORE INTO backup_config (config_key, config_value, description) VALUES
('system_enabled', 'true', 'Habilitar/deshabilitar el sistema de backup'),
('database_backup', '{"enabled":true,"schedule":"daily","time":"02:00","dayOfWeek":1,"dayOfMonth":1,"retention":30,"compression":"gzip","includeStoredProcedures":true,"includeTriggers":true,"includeEvents":false,"singleTransaction":true,"addDropStatements":true}', 'Configuracion de backup de base de datos'),
('files_backup', '{"enabled":true,"schedule":"weekly","time":"03:00","dayOfWeek":0,"dayOfMonth":1,"retention":14,"compression":"gzip","includeUploads":true,"includeConfig":true,"includeLogs":false,"excludePatterns":["*.log","node_modules",".git"]}', 'Configuracion de backup de archivos'),
('storage_local', '{"enabled":true,"path":"/backups","maxSize":5000}', 'Configuracion de almacenamiento local'),
('maintenance', '{"autoCleanup":true,"cleanupRetention":30,"verifyIntegrity":true,"testRestoration":false}', 'Configuracion de mantenimiento');

SELECT 'Configuracion verificada y actualizada' as status;