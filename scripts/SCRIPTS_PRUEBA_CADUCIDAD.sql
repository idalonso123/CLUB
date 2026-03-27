-- ============================================================================
-- SCRIPT DE PRUEBA PARA CADUCIDADES - CLUB VIVEVERDE
-- ============================================================================
-- Este script te permite probar la caducidad de puntos y carnets de mascotas
-- sin tener que esperar el tiempo real.
-- ============================================================================

-- ============================================================================
-- PASO 1: VER DATOS ACTUALES
-- ============================================================================

-- Ver puntos actuales (antes de modificar)
SELECT 'PUNTOS ANTES DE MODIFICAR' AS estado;
SELECT id, persona_id, puntos, fecha_ingreso, fecha_caducidad, caducado, 
       DATEDIFF(fecha_caducidad, NOW()) AS dias_hasta_caducidad
FROM puntos_caducidad
WHERE caducado = 0
LIMIT 10;

-- Ver carnets de mascotas actuales (antes de modificar)
SELECT 'CARNETS ANTES DE MODIFICAR' AS estado;
SELECT id, petName, stamps, expirationDate, createdAt, isExpired, completed,
       DATEDIFF(expirationDate, NOW()) AS dias_hasta_inactividad,
       DATEDIFF(DATE_ADD(createdAt, INTERVAL 24 MONTH), NOW()) AS dias_hasta_limite_maximo
FROM pet_cards
WHERE completed = 0
LIMIT 10;

-- ============================================================================
-- PASO 2: MODIFICAR FECHAS PARA SIMULAR ESCENARIOS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ESCENARIO A: PUNTO CADUCADO (hace 1 día)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un punto que ya caducó:
-- UPDATE puntos_caducidad SET fecha_caducidad = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = [ID_DEL_PUNTO];

-- ----------------------------------------------------------------------------
-- ESCENARIO B: PUNTO PRÓXIMO A CADUCAR (en 5 días)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un punto que caducará pronto:
-- UPDATE puntos_caducidad SET fecha_caducidad = DATE_ADD(NOW(), INTERVAL 5 DAY) WHERE id = [ID_DEL_PUNTO];

-- ----------------------------------------------------------------------------
-- ESCENARIO C: CARNET CADUCADO POR INACTIVIDAD (hace 1 día)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un carnet sin sellos durante 6 meses:
-- UPDATE pet_cards SET expirationDate = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = [ID_DEL_CARNET];

-- ----------------------------------------------------------------------------
-- ESCENARIO D: CARNET PRÓXIMO A CADUCAR POR INACTIVIDAD (en 10 días)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un carnet que caducará pronto:
-- UPDATE pet_cards SET expirationDate = DATE_ADD(NOW(), INTERVAL 10 DAY) WHERE id = [ID_DEL_CARNET];

-- ----------------------------------------------------------------------------
-- ESCENARIO E: CARNET CADUCADO POR LÍMITE MÁXIMO (hace 1 día)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un carnet de 24 meses:
-- UPDATE pet_cards SET createdAt = DATE_SUB(NOW(), INTERVAL 25 MONTH) WHERE id = [ID_DEL_CARNET];

-- ----------------------------------------------------------------------------
-- ESCENARIO F: CARNET PRÓXIMO AL LÍMITE MÁXIMO (en 20 días)
-- ----------------------------------------------------------------------------
-- Descomenta y ejecuta esta línea para simular un carnet próximo al límite:
-- UPDATE pet_cards SET createdAt = DATE_SUB(NOW(), INTERVAL 23 MONTH) WHERE id = [ID_DEL_CARNET];

-- ============================================================================
-- PASO 3: EJECUTAR CRON JOBS (después de modificar las fechas)
-- ============================================================================

-- Para ejecutar los cron jobs, accede a tu navegador:
--
-- Para caducidad de puntos:
-- http://localhost:3000/api/cron/check-expired-points
--
-- Para caducidad de carnets de mascotas:
-- http://localhost:3000/api/cron/check-expired-pet-cards

-- ============================================================================
-- PASO 4: VERIFICAR RESULTADOS
-- ============================================================================

-- Ver puntos después de ejecutar el cron (deberían estar marcados como caducados)
SELECT 'PUNTOS DESPUÉS DEL CRON' AS estado;
SELECT id, persona_id, puntos, fecha_ingreso, fecha_caducidad, caducado
FROM puntos_caducidad
ORDER BY caducado DESC, fecha_caducidad ASC
LIMIT 20;

-- Ver carnets después de ejecutar el cron (deberían estar eliminados)
SELECT 'CARNETS DESPUÉS DEL CRON' AS estado;
SELECT id, petName, stamps, expirationDate, createdAt, isExpired, completed
FROM pet_cards
ORDER BY completed ASC, createdAt DESC
LIMIT 20;

-- ============================================================================
-- PASO 5: RESTAURAR DATOS (LUEGO DE LAS PRUEBAS)
-- ============================================================================

-- Restaurar un punto a su fecha original (+12 meses desde hoy):
-- UPDATE puntos_caducidad SET fecha_caducidad = DATE_ADD(NOW(), INTERVAL 365 DAY) WHERE id = [ID_DEL_PUNTO];

-- Restaurar un carnet (nueva fecha de expiración = hoy + 6 meses):
-- UPDATE pet_cards SET expirationDate = DATE_ADD(NOW(), INTERVAL 6 MONTH), isExpired = 0 WHERE id = [ID_DEL_CARNET];

-- Restaurar la fecha de creación original del carnet:
-- UPDATE pet_cards SET createdAt = NOW() WHERE id = [ID_DEL_CARNET];

-- ============================================================================
-- CONSULTAS ÚTILES PARA IDENTIFICAR IDs
-- ============================================================================

-- Encontrar el ID de los puntos de un usuario específico
-- SELECT id, puntos, fecha_caducidad, DATEDIFF(fecha_caducidad, NOW()) as dias
-- FROM puntos_caducidad 
-- WHERE persona_id = [CODIGO_DEL_USUARIO] AND caducado = 0;

-- Encontrar el ID de los carnets de un usuario específico
-- SELECT id, petName, stamps, expirationDate
-- FROM pet_cards 
-- WHERE userId = [CODIGO_DEL_USUARIO] AND completed = 0;

-- ============================================================================
-- EJEMPLO COMPLETO DE PRUEBA (descomenta y ejecuta línea por línea)
-- ============================================================================

-- 1. Identificar un punto para probar
-- SELECT id, puntos, fecha_caducidad FROM puntos_caducidad WHERE caducado = 0 LIMIT 1;

-- 2. Modificar la fecha del punto (supongamos que el ID es 1)
-- UPDATE puntos_caducidad SET fecha_caducidad = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = 1;

-- 3. Verificar que se modificó
-- SELECT id, puntos, fecha_caducidad, caducado FROM puntos_caducidad WHERE id = 1;

-- 4. Ejecutar el cron job desde el navegador:
-- http://localhost:3000/api/cron/check-expired-points

-- 5. Verificar que el punto se marcó como caducado
-- SELECT id, puntos, fecha_caducidad, caducado FROM puntos_caducidad WHERE id = 1;

-- 6. Verificar que los puntos totales del usuario bajaron
-- SELECT codigo, puntos FROM personas WHERE codigo = (SELECT persona_id FROM puntos_caducidad WHERE id = 1);
