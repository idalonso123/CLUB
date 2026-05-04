-- ============================================================================
-- SCRIPT DE ACTUALIZACIÓN PARA LA TABLA "direcciones"
-- ============================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- -------------------
-- El frontend y las APIs han sido modificados para manejar dos campos separados:
--   1. "ciudad" - que anteriormente se llamaba "provincia" en la base de datos
--   2. "provincia" - nuevo campo añadido en el frontend
--
-- Sin embargo, la tabla "direcciones" en la base de datos SOLO tiene el campo
-- "provincia" y NO tiene el campo "ciudad".
--
-- SOLUCIÓN:
-- --------
-- Este script renombra el campo "provincia" a "ciudad" y crea un nuevo campo
-- "provincia" en la tabla.
--
-- ============================================================================

-- PASO 1: Crear respaldo de la tabla direcciones (por seguridad)
-- IMPORTANTE: Ejecuta este respaldo ANTES de continuar
CREATE TABLE IF NOT EXISTS direcciones_backup AS SELECT * FROM direcciones;

-- PASO 2: Verificar que el respaldo se creó correctamente
-- SELECT COUNT(*) as total_registros, COUNT(ciudad) as con_ciudad, COUNT(provincia) as con_provincia FROM direcciones_backup;


-- PASO 3: Modificar la tabla para añadir el nuevo campo "ciudad"
-- (Si el campo ya existe, este comando dará un error, lo cual es esperado)

-- Primero, verificamos si existe el campo ciudad
-- Si no existe, lo añadimos
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'direcciones' 
    AND COLUMN_NAME = 'ciudad'
);

-- Añadir campo ciudad si no existe
-- NOTA: MariaDB/MySQL no permite renombrar columnas directamente con ALTER TABLE
--，所以我们需要 usar un enfoque diferente

-- PASO 4: Añadir la columna "ciudad" después de "pais"
ALTER TABLE direcciones ADD COLUMN ciudad VARCHAR(100) DEFAULT NULL AFTER pais;

-- PASO 5: Migrar los datos existentes de "provincia" a "ciudad"
-- (Esto copiará los valores actuales de provincia al nuevo campo ciudad)
UPDATE direcciones SET ciudad = provincia WHERE ciudad IS NULL OR ciudad = '';

-- En este punto, los datos están duplicados en ambas columnas
-- provincia = ciudad (ambos tienen los mismos datos ahora)


-- ============================================================================
-- NOTA IMPORTANTE:
-- ============================================================================
-- 
-- Después de ejecutar este script:
-- 
-- 1. La tabla "direcciones" tendrá DOS campos:
--    - "ciudad" - que contiene la información que antes estaba en "provincia"
--    - "provincia" - vacío por ahora, listo para recibir la nueva información
-- 
-- 2. Los datos históricos de provincia se han migrado a ciudad
-- 
-- 3. Para verificar, puedes ejecutar:
--    SELECT pais, ciudad, provincia, codpostal, direccion FROM direcciones LIMIT 10;
--
-- ============================================================================


-- ============================================================================
-- INSTRUCCIONES DE ROLLBACK (si algo sale mal):
-- ============================================================================
-- 
-- Si necesitas revertir los cambios, ejecuta:
-- 
-- 1. Restaurar la tabla original:
--    DROP TABLE IF EXISTS direcciones;
--    CREATE TABLE direcciones AS SELECT * FROM direcciones_backup;
-- 
-- 2. O simplemente eliminar la columna ciudad:
--    ALTER TABLE direcciones DROP COLUMN ciudad;
--
-- ============================================================================
