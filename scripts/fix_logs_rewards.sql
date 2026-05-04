-- Script para verificar y corregir la tabla logs_rewards
-- Ejecuta este script si tienes problemas al crear recompensas

-- 1. Verificar que la tabla existe
SELECT '=== VERIFICANDO TABLA logs_rewards ===' AS paso;
DESCRIBE logs_rewards;

-- 2. Verificar si hay registros con user_id que no existen en personas
SELECT '=== USER_IDS INVALIDOS ===' AS paso;
SELECT lr.id, lr.user_id, lr.action, lr.reward_id
FROM logs_rewards lr
LEFT JOIN personas p ON lr.user_id = p.codigo
WHERE p.codigo IS NULL AND lr.user_id != 0;

-- 3. Verificar si hay registros con reward_id que no existen en recompensas
SELECT '=== REWARD_IDS INVALIDOS ===' AS paso;
SELECT lr.id, lr.user_id, lr.action, lr.reward_id
FROM logs_rewards lr
LEFT JOIN recompensas r ON lr.reward_id = r.id
WHERE r.id IS NULL;

-- 4. Hacer el campo user_id nullable (para evitar errores si el usuario no existe)
-- Esto es una solución alternativa si tienes problemas con la foreign key
-- ALTER TABLE logs_rewards MODIFY user_id INT NULL;

-- 5. Verificar el contenido de los logs
SELECT '=== ULTIMOS 10 LOGS ===' AS paso;
SELECT * FROM logs_rewards ORDER BY id DESC LIMIT 10;

-- 6. Si hay problemas con JSON, verificar los detalles
SELECT '=== LOGS CON POSIBLES ERRORES DE JSON ===' AS paso;
SELECT id, user_id, action, reward_id, details
FROM logs_rewards
WHERE details IS NOT NULL 
AND JSON_VALID(details) = 0;