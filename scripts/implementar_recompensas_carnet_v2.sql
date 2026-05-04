-- ============================================
-- SCRIPT CORREGIDO: Implementar Sistema de Recompensas de Carnet de Mascota
-- ============================================
-- Este script añade las modificaciones necesarias para el sistema de recompensas
-- que se generan cuando un usuario completa un carnet de mascota.
-- ============================================

-- Paso 1: Añadir columna tipo_recompensa a la tabla recompensas
-- Esta columna distingue entre recompensas por puntos y recompensas por carnet completado
ALTER TABLE recompensas 
ADD COLUMN tipo_recompensa ENUM('puntos', 'carnet') DEFAULT 'puntos' 
AFTER puntos;

-- Paso 2: Crear tabla para historial de carnets completados (canjeados)
-- IMPORTANTE: Usar IF NOT EXISTS para evitar errores si ya existe
CREATE TABLE IF NOT EXISTS historial_carnets_mascota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  persona_id INT NOT NULL COMMENT 'ID del usuario',
  carnet_id INT NOT NULL COMMENT 'ID del carnet completado',
  recompensa_id INT NOT NULL COMMENT 'ID de la recompensa canjeada',
  nombre_pienso VARCHAR(255) NOT NULL COMMENT 'Nombre del pienso que se canjeó',
  codigo_barras_producto VARCHAR(50) NULL COMMENT 'Código de barras del producto original',
  fecha_canje DATETIME NOT NULL COMMENT 'Fecha cuando se canjeó el saco gratis',
  
  -- Índices
  INDEX idx_persona_id (persona_id),
  INDEX idx_fecha_canje (fecha_canje),
  
  -- Clave foránea (opcional, comentar si causa problemas)
  -- CONSTRAINT fk_hcm_persona FOREIGN KEY (persona_id) REFERENCES personas(codigo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Verificación
-- ============================================

-- Mostrar la estructura de la tabla recompensas (verificar tipo_recompensa)
SELECT '=== Columna tipo_recompensa en recompensas ===' AS mensaje;
SHOW COLUMNS FROM recompensas LIKE 'tipo_recompensa';

-- Verificar que la tabla historial_carnets_mascota existe
SELECT '=== Verificación: tabla historial_carnets_mascota ===' AS mensaje;
SHOW TABLES LIKE 'historial_carnets_mascota';

-- Mostrar estructura de historial_carnets_mascota
DESCRIBE historial_carnets_mascota;

-- Verificar que la tabla recompensas_carnet_mascota tiene las columnas necesarias
SELECT '=== Tabla recompensas_carnet_mascota (ya existente) ===' AS mensaje;
DESCRIBE recompensas_carnet_mascota;

SELECT 'Script completado correctamente.' AS mensaje;
