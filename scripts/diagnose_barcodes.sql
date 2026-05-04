-- Script de diagnóstico para verificar problemas con códigos de barras
-- Ejecuta estos comandos en MySQL para diagnosticar

-- 1. Verificar que la tabla recompensas tiene el último ID
SELECT '=== ULTIMA RECOMPENSA ===' AS paso;
SELECT id, nombre, fecha_creacion FROM recompensas ORDER BY id DESC LIMIT 1;

-- 2. Verificar que recompensa_id existe en codigos_barras
SELECT '=== ESTRUCTURA codigos_barras ===' AS paso;
DESCRIBE codigos_barras;

-- 3. Verificar que la FK permite插入
SELECT '=== VERIFICAR FK ===' AS paso;
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'codigos_barras';

-- 4. Probar插入 manual de código de barras
SELECT '=== PRUEBA INSERT MANUAL ===' AS paso;
-- Primero obtener el último ID de recompensa
SELECT @ultima_recompensa := id FROM recompensas ORDER BY id DESC LIMIT 1;

-- Insertar un código de barras de prueba
INSERT INTO codigos_barras (recompensa_id, codigo, descripcion) 
VALUES (@ultima_recompensa, 'TEST_MANUAL_001', 'Prueba manual');

-- Verificar que se插入ó
SELECT * FROM codigos_barras WHERE codigo = 'TEST_MANUAL_001';

-- Eliminar el código de prueba
DELETE FROM codigos_barras WHERE codigo = 'TEST_MANUAL_001';

-- 5. Verificar si hay códigos huérfanos (que referencian recompensas eliminadas)
SELECT '=== CODIGOS ORFHANOS ===' AS paso;
SELECT cb.* 
FROM codigos_barras cb
LEFT JOIN recompensas r ON cb.recompensa_id = r.id
WHERE r.id IS NULL;

-- 6. Ver todos los códigos con su recompensa
SELECT '=== TODOS LOS CODIGOS ===' AS paso;
SELECT 
    cb.id,
    cb.recompensa_id,
    r.nombre AS recompensa_nombre,
    cb.codigo,
    cb.descripcion
FROM codigos_barras cb
JOIN recompensas r ON cb.recompensa_id = r.id
ORDER BY cb.recompensa_id DESC, cb.id DESC;
