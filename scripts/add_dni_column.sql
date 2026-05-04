-- Script para añadir la columna DNI a la tabla personas
-- Ejecutar este script en la base de datos para añadir el campo

-- Añadir columna DNI a la tabla personas (si no existe)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS dni VARCHAR(20) NULL;

-- Añadir índice único para el DNI (para evitar duplicados)
-- Primero verificamos si ya existe un índice único en la columna
-- Nota: MySQL/MariaDB no soporta ADD INDEX IF NOT EXISTS, así que verificamos manualmente

-- Crear índice único solo si no existe
-- Esta consulta es compatible con MySQL 8.0+ y MariaDB 10.5+
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'personas' 
               AND INDEX_NAME = 'dni_unique');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Index already exists" as result', 
                   'CREATE UNIQUE INDEX dni_unique ON personas(dni)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Comentario sobre la columna
ALTER TABLE personas COMMENT 'Documento Nacional de Identidad o equivalente para otros países';
