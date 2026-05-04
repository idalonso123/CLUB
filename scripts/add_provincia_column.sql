-- ============================================================================
-- SCRIPT PARA AÑADIR LA COLUMNA "provincia" A LA TABLA "direcciones"
-- ============================================================================
-- 
-- PROBLEMA: 
-- --------
-- El campo "provincia" no existe en la tabla direcciones de tu base de datos.
-- El frontend y las APIs intentan guardar "provincia" pero el campo no existe,
-- por lo que los datos se pierden.
--
-- SOLUCIÓN:
-- --------
-- Este script añade la columna "provincia" a la tabla.
--
-- ============================================================================

-- PASO 1: Crear respaldo de la tabla (por seguridad)
CREATE TABLE IF NOT EXISTS direcciones_backup_final AS SELECT * FROM direcciones;

-- PASO 2: Añadir la columna "provincia" después de "ciudad"
ALTER TABLE direcciones ADD COLUMN provincia VARCHAR(100) DEFAULT NULL AFTER ciudad;

-- PASO 3: Verificar que la columna se añadió correctamente
DESCRIBE direcciones;

-- PASO 4: Ver datos de ejemplo
SELECT pais, ciudad, provincia, codpostal, direccion FROM direcciones LIMIT 5;

-- ============================================================================
-- NOTA:
-- ============================================================================
-- 
-- Una vez ejecutados estos comandos:
-- 
-- - La tabla tendrá ambos campos: "ciudad" y "provincia"
-- - Los datos existentes de "ciudad" permanecerán intactos
-- - El nuevo campo "provincia" estará vacío para los registros existentes
-- - Los nuevos registros podrán guardar tanto ciudad como provincia
--
-- ============================================================================


-- ============================================================================
-- INSTRUCCIONES DE ROLLBACK (si algo sale mal):
-- ============================================================================
-- 
-- Si necesitas revertir los cambios:
-- 
--    ALTER TABLE direcciones DROP COLUMN provincia;
-- 
-- O restaurar desde el respaldo:
-- 
--    DROP TABLE IF EXISTS direcciones;
--    CREATE TABLE direcciones AS SELECT * FROM direcciones_backup_final;
--
-- ============================================================================
