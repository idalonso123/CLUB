-- =====================================================
-- Script para crear la tabla productos_carnet_mascota
-- Tabla para almacenar los productos disponibles para generar carnets de mascotas
-- =====================================================

-- Crear la tabla productos_carnet_mascota
CREATE TABLE IF NOT EXISTS `productos_carnet_mascota` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `Articulo` VARCHAR(20) NOT NULL COMMENT 'Código de artículo',
  `Nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del artículo',
  `Talla` VARCHAR(50) DEFAULT NULL COMMENT 'Talla del artículo',
  `Color` VARCHAR(50) DEFAULT NULL COMMENT 'Color del artículo',
  `C_Barras` VARCHAR(20) NOT NULL COMMENT 'Código de barras (único)',
  `PVP` DECIMAL(10,2) NOT NULL COMMENT 'Precio de venta al público',
  `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Si el producto está activo para carnets',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `fecha_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  UNIQUE KEY `c_barras_unique` (`C_Barras`),
  INDEX `idx_articulo` (`Articulo`),
  INDEX `idx_nombre` (`Nombre`),
  INDEX `idx_buscar` (`Articulo`, `Nombre`, `C_Barras`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- NOTA IMPORTANTE:
-- Después de ejecutar este script, necesitas importar los datos del Excel
-- 
-- Para importar desde Excel/CSV, usa:
-- 1. Exporta el Excel como CSV ( UTF-8 )
-- 2. Ejecuta en MySQL:
--
-- LOAD DATA LOCAL INFILE '/ruta/al/archivo.csv'
-- INTO TABLE productos_carnet_mascota
-- FIELDS TERMINATED BY ',' 
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 ROWS
-- (Articulo, Nombre, Talla, Color, C_Barras, PVP);
--
-- O usa phpMyAdmin > Importar > Selecciona el archivo CSV
-- =====================================================
