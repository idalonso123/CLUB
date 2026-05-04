-- =====================================================
-- Script de Migración: Añadir Campos GDPR a la Tabla personas
-- Club ViveVerde - Cumplimiento RGPD
-- Fecha: 2026-04-28
-- =====================================================
-- Este script añade las columnas necesarias para registrar
-- el consentimiento GDPR de los usuarios durante el registro.
-- =====================================================

-- Usar la base de datos correspondiente (ajustar según configuración)
-- USE clubviveverde;

-- =====================================================
-- 1. Añadir columnas de consentimiento GDPR a la tabla personas
-- =====================================================

-- Columna para registrar si el usuario aceptó los términos y condiciones
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS terms_accepted TINYINT(1) NOT NULL DEFAULT 0
COMMENT 'Indica si el usuario aceptó los términos y condiciones (GDPR)';

-- Columna para almacenar la versión de los términos aceptados
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20) DEFAULT NULL
COMMENT 'Versión de los términos y condiciones aceptados por el usuario';

-- Columna para registrar la fecha y hora de aceptación de los términos
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS terms_accepted_at DATETIME DEFAULT NULL
COMMENT 'Fecha y hora en que el usuario aceptó los términos y condiciones';

-- Columna para registrar si el usuario aceptó la política de privacidad
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS privacy_policy_accepted TINYINT(1) NOT NULL DEFAULT 0
COMMENT 'Indica si el usuario aceptó la política de privacidad (GDPR)';

-- Columna para almacenar la versión de la política de privacidad aceptada
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(20) DEFAULT NULL
COMMENT 'Versión de la política de privacidad aceptada por el usuario';

-- Columna para registrar la fecha y hora de aceptación de la política de privacidad
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at DATETIME DEFAULT NULL
COMMENT 'Fecha y hora en que el usuario aceptó la política de privacidad';

-- Columna para almacenar el User-Agent del navegador del usuario
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS browser_user_agent TEXT DEFAULT NULL
COMMENT 'User-Agent del navegador utilizado durante el registro';

-- Columna para almacenar el idioma del navegador
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS browser_language VARCHAR(20) DEFAULT NULL
COMMENT 'Idioma del navegador utilizado durante el registro';

-- Columna para almacenar la plataforma del sistema operativo
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS browser_platform VARCHAR(50) DEFAULT NULL
COMMENT 'Plataforma/Sistema operativo del dispositivo utilizado';

-- Columna para almacenar la dirección IP del usuario durante el registro
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45) DEFAULT NULL
COMMENT 'Dirección IP del usuario en el momento del registro (IPv4 o IPv6)';

-- Columna para almacenar la fecha de vigencia de los documentos legales aceptados
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS terms_effective_date DATE DEFAULT NULL
COMMENT 'Fecha de vigencia de los términos y condiciones aceptados';

-- =====================================================
-- 2. Crear tabla para historial de versiones de documentos legales
-- =====================================================

CREATE TABLE IF NOT EXISTS legal_documents_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type ENUM('terms', 'privacy_policy') NOT NULL COMMENT 'Tipo de documento: terms o privacy_policy',
    document_version VARCHAR(20) NOT NULL COMMENT 'Versión del documento',
    action ENUM('accepted', 'viewed', 'updated') NOT NULL DEFAULT 'accepted' COMMENT 'Acción realizada',
    accepted_at DATETIME NOT NULL COMMENT 'Fecha y hora de la acción',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Dirección IP del usuario',
    browser_user_agent TEXT DEFAULT NULL COMMENT 'User-Agent del navegador',
    metadata JSON DEFAULT NULL COMMENT 'Metadatos adicionales en formato JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_document_type (document_type),
    INDEX idx_accepted_at (accepted_at),
    FOREIGN KEY (user_id) REFERENCES personas(codigo) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de aceptación de documentos legales por usuario';

-- =====================================================
-- 3. Crear tabla para registro de consentimientos (auditoría GDPR)
-- =====================================================

CREATE TABLE IF NOT EXISTS gdpr_consent_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL COMMENT 'ID del usuario (NULL si es un intento fallido)',
    email VARCHAR(255) DEFAULT NULL COMMENT 'Email del usuario (para auditorías)',
    consent_type VARCHAR(50) NOT NULL COMMENT 'Tipo de consentimiento (registration, marketing, etc.)',
    granted BOOLEAN NOT NULL COMMENT 'TRUE si consentió, FALSE si no',
    document_version VARCHAR(20) DEFAULT NULL COMMENT 'Versión del documento aceptado',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Dirección IP',
    user_agent TEXT DEFAULT NULL COMMENT 'User-Agent del navegador',
    browser_language VARCHAR(20) DEFAULT NULL COMMENT 'Idioma del navegador',
    browser_platform VARCHAR(50) DEFAULT NULL COMMENT 'Plataforma/Sistema operativo',
    consent_timestamp DATETIME NOT NULL COMMENT 'Marca temporal del consentimiento',
    request_data JSON DEFAULT NULL COMMENT 'Datos completos de la petición para auditoría',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_consent_type (consent_type),
    INDEX idx_consent_timestamp (consent_timestamp),
    INDEX idx_email (email),
    FOREIGN KEY (user_id) REFERENCES personas(codigo) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log detallado de consentimientos GDPR para auditoría';

-- =====================================================
-- 4. Actualizar tabla logs_admin para incluir información GDPR
-- =====================================================

-- Añadir columnas adicionales a logs_admin si no existen
-- (Esta tabla ya existe, solo añadimos columnas si es necesario)

-- =====================================================
-- 5. Crear procedimiento almacenado para generar informes GDPR
-- =====================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_gdpr_consent_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE(terms_accepted_at) as fecha,
        COUNT(*) as total_registros,
        SUM(terms_accepted) as aceptaron_tyc,
        SUM(privacy_policy_accepted) as aceptaron_pp,
        ROUND((SUM(terms_accepted) / COUNT(*)) * 100, 2) as porcentaje_tyc,
        ROUND((SUM(privacy_policy_accepted) / COUNT(*)) * 100, 2) as porcentaje_pp
    FROM personas
    WHERE terms_accepted_at BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(terms_accepted_at)
    ORDER BY fecha DESC;
END //

DELIMITER ;

-- =====================================================
-- 6. Crear vista para resumen de cumplimiento GDPR
-- =====================================================

CREATE OR REPLACE VIEW v_gdpr_compliance_summary AS
SELECT 
    COUNT(*) as total_usuarios,
    SUM(CASE WHEN terms_accepted = 1 THEN 1 ELSE 0 END) as usuarios_tyc_aceptado,
    SUM(CASE WHEN privacy_policy_accepted = 1 THEN 1 ELSE 0 END) as usuarios_pp_aceptado,
    SUM(CASE WHEN terms_accepted = 0 OR privacy_policy_accepted = 0 THEN 1 ELSE 0 END) as usuarios_sin_consentimiento,
    ROUND((SUM(CASE WHEN terms_accepted = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as porcentaje_tyc,
    ROUND((SUM(CASE WHEN privacy_policy_accepted = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as porcentaje_pp
FROM personas
WHERE DATE(created_at) >= '2026-04-28'; -- Desde la fecha de implementación

-- =====================================================
-- 7. Verificación de la migración
-- =====================================================

-- Verificar que las columnas se han creado correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'personas' 
AND COLUMN_NAME IN (
    'terms_accepted', 'terms_version', 'terms_accepted_at',
    'privacy_policy_accepted', 'privacy_policy_version', 'privacy_policy_accepted_at',
    'browser_user_agent', 'browser_language', 'browser_platform',
    'registration_ip', 'terms_effective_date'
)
ORDER BY COLUMN_NAME;

-- Mostrar las nuevas tablas creadas
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('legal_documents_log', 'gdpr_consent_log');

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================
-- 
-- 1. Realizar un backup completo de la base de datos antes de ejecutar
-- 2. Ejecutar este script con un usuario que tenga permisos de DDL:
--    mysql -u usuario -p base_de_datos < migration_gdpr_consent.sql
-- 
-- 3. Verificar que no hay errores en la ejecución
-- 4. Comprobar que las columnas se han creado correctamente usando
--    la consulta de verificación incluida
-- 5. Actualizar la documentación del sistema con los nuevos campos
-- 
-- =====================================================
-- ROLLBACK (en caso de necesidad)
-- =====================================================
-- 
-- Para revertir los cambios, ejecutar:
-- 
-- -- Eliminar columnas añadidas
-- ALTER TABLE personas 
--     DROP COLUMN IF EXISTS terms_accepted,
--     DROP COLUMN IF EXISTS terms_version,
--     DROP COLUMN IF EXISTS terms_accepted_at,
--     DROP COLUMN IF EXISTS privacy_policy_accepted,
--     DROP COLUMN IF EXISTS privacy_policy_version,
--     DROP COLUMN IF EXISTS privacy_policy_accepted_at,
--     DROP COLUMN IF EXISTS browser_user_agent,
--     DROP COLUMN IF EXISTS browser_language,
--     DROP COLUMN IF EXISTS browser_platform,
--     DROP COLUMN IF EXISTS registration_ip,
--     DROP COLUMN IF EXISTS terms_effective_date;
-- 
-- -- Eliminar tablas creadas
-- DROP TABLE IF EXISTS gdpr_consent_log;
-- DROP TABLE IF EXISTS legal_documents_log;
-- 
-- -- Eliminar procedimiento y vista
-- DROP PROCEDURE IF EXISTS sp_gdpr_consent_report;
-- DROP VIEW IF EXISTS v_gdpr_compliance_summary;
-- 
-- =====================================================
