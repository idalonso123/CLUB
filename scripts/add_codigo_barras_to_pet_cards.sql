-- =====================================================
-- Script para añadir columna codigo_barras a pet_cards
-- Esta columna vinculará cada carnet con el código de barras del producto
-- =====================================================

-- Añadir columna codigo_barras si no existe
ALTER TABLE `pet_cards` 
ADD COLUMN `codigo_barras` VARCHAR(20) NULL 
COMMENT 'Código de barras del producto vinculado a este carnet' 
AFTER `productName`;

-- Añadir índice para buscar carnets por código de barras
CREATE INDEX IF NOT EXISTS `idx_codigo_barras` ON `pet_cards` (`codigo_barras`);

-- =====================================================
-- NOTA: Este script debe ejecutarse en producción antes
-- de desplegar la nueva versión de la aplicación
-- =====================================================
