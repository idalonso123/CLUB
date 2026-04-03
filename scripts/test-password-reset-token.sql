-- Script de diagnóstico para verificar la tabla password_reset_tokens
-- Ejecuta este script en MySQL para verificar la estructura y probar inserciones

-- 1. Verificar que la tabla existe
DESCRIBE password_reset_tokens;

-- 2. Verificar que la tabla personas tiene el campo codigo
DESCRIBE personas;

-- 3. Obtener un usuario de prueba para verificar el tipo de dato
SELECT codigo, mail FROM personas LIMIT 1;

-- 4. Probar insertar un token de prueba (reemplaza USER_ID con un código real)
-- INSERT INTO password_reset_tokens (user_id, token, expires_at) 
-- VALUES (USER_ID, 'test_token_12345', NOW() + INTERVAL 1 HOUR);

-- 5. Verificar los tokens existentes
SELECT * FROM password_reset_tokens LIMIT 5;
