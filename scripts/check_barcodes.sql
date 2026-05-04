-- Script para diagnosticar problemas de códigos de barras
-- Ejecuta este script en tu base de datos MySQL para verificar el estado de los datos

-- 1. Verificar si la tabla codigos_barras tiene datos
SELECT '=== TABLA CODIGOS_BARRAS ===' AS estado;
SELECT COUNT(*) AS total_codigos FROM codigos_barras;

-- 2. Ver todas las recompensas con sus códigos de barras
SELECT '=== RECOMPENSAS CON CODIGOS ===' AS estado;
SELECT 
    r.id AS recompensa_id,
    r.nombre AS recompensa_nombre,
    cb.id AS barcode_id,
    cb.codigo,
    cb.descripcion
FROM recompensas r
LEFT JOIN codigos_barras cb ON r.id = cb.recompensa_id
ORDER BY r.id, cb.id;

-- 3. Verificar recompensas que NO tienen códigos de barras
SELECT '=== RECOMPENSAS SIN CODIGOS ===' AS estado;
SELECT 
    r.id AS recompensa_id,
    r.nombre AS recompensa_nombre
FROM recompensas r
LEFT JOIN codigos_barras cb ON r.id = cb.recompensa_id
WHERE cb.id IS NULL
ORDER BY r.id;

-- 4. Verificar si hay códigos duplicados
SELECT '=== CODIGOS DUPLICADOS ===' AS estado;
SELECT codigo, COUNT(*) AS cantidad
FROM codigos_barras
GROUP BY codigo
HAVING COUNT(*) > 1;

-- 5. Ver últimos códigos insertados
SELECT '=== ULTIMOS CODIGOS INSERTADOS ===' AS estado;
SELECT * FROM codigos_barras
ORDER BY id DESC
LIMIT 10;

-- 6. Ver estructura de la tabla codigos_barras
SELECT '=== ESTRUCTURA TABLA CODIGOS_BARRAS ===' AS estado;
DESCRIBE codigos_barras;

-- 7. Verificar foreign key constraint
SELECT '=== FOREIGN KEY CONSTRAINT ===' AS estado;
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'codigos_barras'
AND REFERENCED_TABLE_NAME IS NOT NULL;
