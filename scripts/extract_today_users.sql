-- Script SQL para extraer usuarios creados en el día de hoy
-- Ejecución: mysql -u root -p "Club ViveVerde" < scripts/extract_today_users.sql
-- O desde phpMyAdmin: Ejecutar este SQL

-- Definir la fecha actual (puedes cambiar '2026-04-06' por CURDATE() para usar la fecha del sistema)
SET @fecha_hoy = CURDATE();

-- Mostrar información del script
SELECT 'EXTRACCIÓN DE USUARIOS CREADOS HOY' AS titulo, @fecha_hoy AS fecha_busqueda;

-- Consulta principal: Usuarios creados hoy
SELECT 
    codigo AS id_usuario,
    cif AS identificador,
    CONCAT(COALESCE(nombres, ''), ' ', COALESCE(apellidos, '')) AS nombre_completo,
    mail AS email,
    telefono,
    rol,
    DATE_FORMAT(creado_en, '%Y-%m-%d %H:%i:%s') AS fecha_creacion,
    CASE status 
        WHEN 1 THEN 'Activo'
        WHEN 0 THEN 'Inactivo'
        ELSE 'Desconocido'
    END AS estado,
    puntos
FROM personas
WHERE DATE(creado_en) = @fecha_hoy
ORDER BY creado_en DESC;

-- Contador de usuarios
SELECT 
    COUNT(*) AS total_usuarios_hoy
FROM personas
WHERE DATE(creado_en) = @fecha_hoy;

-- Exportar a CSV (descomenta las siguientes líneas para generar CSV)
-- INTO OUTFILE '/tmp/usuarios_hoy.csv'
-- FIELDS TERMINATED BY ','
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
