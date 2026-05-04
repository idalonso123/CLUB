-- ============================================
-- SCRIPT: Implementar Sistema de Recompensas de Carnet de Mascota
-- ============================================
-- Este script añade las modificaciones necesarias para el sistema de recompensas
-- que se generan cuando un usuario completa un carnet de mascota.
-- ============================================

-- Paso 1: Añadir columna tipo_recompensa a la tabla recompensas
-- Esta columna distingue entre recompensas por puntos y recompensas por carnet completado
ALTER TABLE recompensas 
ADD COLUMN tipo_recompensa ENUM('puntos', 'carnet') DEFAULT 'puntos' 
AFTER puntos;

-- Paso 2: Crear tabla para gestionar las recompensas de carnet generadas por usuario
-- Esta tabla mapea cada carnet completado con la recompensa base del admin
CREATE TABLE IF NOT EXISTS recompensas_carnet_usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  persona_id INT NOT NULL COMMENT 'ID del usuario que completó el carnet',
  carnet_id INT NOT NULL COMMENT 'ID del carnet completado',
  recompensa_id INT NOT NULL COMMENT 'ID de la recompensa plantilla (tipo carnet)',
  nombre_pienso VARCHAR(255) NOT NULL COMMENT 'Nombre del pienso específico del carnet',
  codigo_barras_producto VARCHAR(50) NULL COMMENT 'Código de barras del producto del carnet',
  canjeada BOOLEAN DEFAULT FALSE COMMENT 'Indica si la recompensa ha sido canjeada',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha cuando se generó la recompensa',
  fecha_canje DATETIME NULL COMMENT 'Fecha cuando se canjeó la recompensa',
  
  -- Índices para optimizar consultas
  INDEX idx_persona_id (persona_id),
  INDEX idx_carnet_id (carnet_id),
  INDEX idx_recompensa_id (recompensa_id),
  INDEX idx_canjeada (canjeada),
  
  -- Clave única para evitar duplicados de recompensas para el mismo carnet
  UNIQUE KEY unique_carnet (carnet_id),
  
  -- Claves foráneas
  CONSTRAINT fk_rcu_persona FOREIGN KEY (persona_id) REFERENCES personas(codigo) ON DELETE CASCADE,
  CONSTRAINT fk_rcu_carnet FOREIGN KEY (carnet_id) REFERENCES carnets_mascota(id) ON DELETE CASCADE,
  CONSTRAINT fk_rcu_recompensa FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paso 3: Crear tabla para historial de carnets completados (canjeados)
-- Esta tabla registra los carnets cuyos sacos gratis ya fueron canjeados
CREATE TABLE IF NOT EXISTS historial_carnets_mascota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  persona_id INT NOT NULL COMMENT 'ID del usuario',
  carnet_id INT NOT NULL COMMENT 'ID del carnet completado',
  nombre_mascota VARCHAR(100) NOT NULL COMMENT 'Nombre de la mascota',
  tipo_mascota VARCHAR(50) NOT NULL COMMENT 'Tipo de mascota (Perro, Gato, etc.)',
  nombre_pienso VARCHAR(255) NOT NULL COMMENT 'Nombre del pienso que se canjeó',
  codigo_barras_producto VARCHAR(50) NULL COMMENT 'Código de barras del producto original',
  fecha_completado DATETIME NOT NULL COMMENT 'Fecha cuando se completó el carnet',
  fecha_canje DATETIME NOT NULL COMMENT 'Fecha cuando se canjeó el saco gratis',
  
  -- Índices
  INDEX idx_persona_id (persona_id),
  INDEX idx_fecha_canje (fecha_canje),
  
  -- Clave foránea
  CONSTRAINT fk_hcm_persona FOREIGN KEY (persona_id) REFERENCES personas(codigo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Verificación
-- ============================================
-- Mostrar la estructura de las tablas modificadas

SELECT '=== Estructura de recompensas ===' AS mensaje;
DESCRIBE recompensas;

SELECT '=== Nueva tabla recompensas_carnet_usuario ===' AS mensaje;
DESCRIBE recompensas_carnet_usuario;

SELECT '=== Nueva tabla historial_carnets_mascota ===' AS mensaje;
DESCRIBE historial_carnets_mascota;

-- Verificar que se han creado correctamente
SELECT '=== Verificación de tablas creadas ===' AS mensaje;
SHOW TABLES LIKE 'recompensas_carnet_usuario';
SHOW TABLES LIKE 'historial_carnets_mascota';

SELECT 'Script completado correctamente.' AS mensaje;