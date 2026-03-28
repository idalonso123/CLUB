-- ============================================
-- SCRIPT DE MIGRACIÓN: Corrección de columna email_segments
-- Club ViveVerde - Base de Datos
-- ============================================
-- Este script corrige la inconsistencia entre los campos 'criteria' y 'filters'
-- en la tabla email_segments
-- ============================================

-- Verificar si existe la columna 'criteria' y no existe 'filters'
-- Si es así, renombrar 'criteria' a 'filters'

SET @column_name = (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'email_segments' 
    AND COLUMN_NAME = 'criteria'
);

SET @has_filters = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'email_segments' 
    AND COLUMN_NAME = 'filters'
);

-- Si existe 'criteria' pero no 'filters', renombrar
IF @column_name IS NOT NULL AND @has_filters = 0 THEN
    ALTER TABLE email_segments CHANGE COLUMN criteria filters JSON NOT NULL;
    SELECT 'Columna criteria renombrada a filters correctamente' AS resultado;
ELSEIF @column_name IS NOT NULL AND @has_filters > 0 THEN
    -- Si existen ambas, copiar datos de criteria a filters si filters está vacío
    UPDATE email_segments SET filters = criteria WHERE filters IS NULL OR filters = '' OR JSON_LENGTH(filters) = 0;
    SELECT 'Datos migrados de criteria a filters' AS resultado;
ELSEIF @has_filters > 0 THEN
    SELECT 'La tabla ya tiene la columna filters correctamente' AS resultado;
ELSE
    SELECT 'ADVERTENCIA: No se encontró ninguna columna de filtros en la tabla' AS resultado;
END IF;

-- Verificar la estructura final de la tabla
DESCRIBE email_segments;

-- Mostrar datos de prueba
SELECT id, name, LEFT(filters, 100) as filters_preview FROM email_segments LIMIT 5;
