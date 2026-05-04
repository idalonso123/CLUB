-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 19-05-2025 a las 17:47:51
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `viveverde`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `canjes_recompensas`
--

CREATE TABLE `canjes_recompensas` (
  `id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `recompensa_id` int(11) NOT NULL,
  `puntos_canjeados` int(11) NOT NULL,
  `estado` enum('pendiente','completado','cancelado','expirado') NOT NULL DEFAULT 'pendiente',
  `direccion_envio` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `codigo_barras_asignado` varchar(50) DEFAULT NULL,
  `codigo_visible` varchar(50) DEFAULT NULL,
  `fecha_canje` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_expiracion` datetime DEFAULT NULL,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `codigos_barras`
--

CREATE TABLE `codigos_barras` (
  `id` int(11) NOT NULL,
  `recompensa_id` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `config_default_puntos`
--

CREATE TABLE `config_default_puntos` (
  `id` int(11) NOT NULL,
  `clave` varchar(50) NOT NULL DEFAULT 'euros_por_punto',
  `valor` decimal(10,2) NOT NULL DEFAULT 3.50,
  `fecha_modificacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Datos iniciales para la tabla `config_default_puntos`
--

INSERT INTO `config_default_puntos` (`id`, `clave`, `valor`, `fecha_modificacion`) VALUES
(1, 'euros_por_punto', 3.50, CURRENT_TIMESTAMP()),
(2, 'puntos_bienvenida', 5.00, CURRENT_TIMESTAMP()),
(3, 'caducidad_puntos_meses', 12, CURRENT_TIMESTAMP()),
(4, 'caducidad_carnet_inactividad_meses', 6, CURRENT_TIMESTAMP()),
(5, 'caducidad_carnet_antiguedad_meses', 24, CURRENT_TIMESTAMP()),
(6, 'sellos_requeridos_carnet', 6, CURRENT_TIMESTAMP());

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `pais` varchar(50) DEFAULT NULL,
  `provincia` varchar(50) DEFAULT NULL,
  `codpostal` char(5) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `codigo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_admin`
--

CREATE TABLE `logs_admin` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL COMMENT 'create, update, delete, status_change, points_adjustment',
  `entity_type` varchar(50) NOT NULL COMMENT 'user, product, order, etc',
  `entity_id` int(11) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_auth`
--

CREATE TABLE `logs_auth` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NULL,
  `action` enum('login','logout','failed_login','password_change','password_reset') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_export`
--

CREATE TABLE `logs_export` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `export_type` varchar(50) NOT NULL COMMENT 'users, products, orders, etc',
  `format` varchar(20) NOT NULL COMMENT 'csv, excel, pdf',
  `filters` text DEFAULT NULL COMMENT 'JSON con los filtros aplicados',
  `record_count` int(11) DEFAULT NULL COMMENT 'Número de registros exportados',
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_points`
--

CREATE TABLE `logs_points` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `puntos` int(11) NOT NULL,
  `puntos_previos` int(11) NOT NULL,
  `puntos_nuevos` int(11) NOT NULL,
  `motivo` text NOT NULL,
  `fecha` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `puntos_caducidad`
--

CREATE TABLE `puntos_caducidad` (
  `id` int(11) NOT NULL,
  `persona_id` int(11) NOT NULL,
  `puntos` int(11) NOT NULL,
  `fecha_ingreso` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_caducidad` datetime NOT NULL,
  `caducado` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `config_rewards_teller`
--

CREATE TABLE `config_rewards_teller` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(50) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_modificacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave_unique` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Inserción inicial para la tabla `config_rewards_teller`
--

INSERT INTO `config_rewards_teller` (`clave`, `valor`, `descripcion`) VALUES
('teller_rewards', '{"showAllRewards":true,"rewardIds":[]}', 'Configuración de recompensas visibles en el cajero');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `config_niveles_cliente`
--

CREATE TABLE IF NOT EXISTS `config_niveles_cliente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nivel` int(11) NOT NULL COMMENT 'Orden del nivel (1=Semilla, 2=Brote, 3=Hoja, 4=Flor)',
  `nombre` varchar(50) NOT NULL COMMENT 'Nombre del nivel',
  `icono` varchar(10) DEFAULT NULL COMMENT 'Emoji o icono del nivel',
  `puntos_minimos` int(11) NOT NULL COMMENT 'Puntos mínimos para este nivel',
  `puntos_maximos` int(11) DEFAULT NULL COMMENT 'Puntos máximos para este nivel (NULL = sin límite)',
  `euros_compra_minima` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Compra mínima semestral requerida',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si el nivel está activo',
  `fecha_modificacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nivel_unique` (`nivel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Datos iniciales para la tabla `config_niveles_cliente`
--

INSERT INTO `config_niveles_cliente` (`nivel`, `nombre`, `icono`, `puntos_minimos`, `puntos_maximos`, `euros_compra_minima`, `activo`) VALUES
(1, 'Semilla', '🌱', 0, 49, 0.00, 1),
(2, 'Brote', '🌿', 50, 89, 150.00, 1),
(3, 'Hoja', '🍃', 90, 169, 300.00, 1),
(4, 'Flor', '🌸', 170, NULL, 500.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_rewards`
--

CREATE TABLE `logs_rewards` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` enum('create','update','delete','disable','view') NOT NULL,
  `reward_id` int(11) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mainpage_cards`
--

CREATE TABLE `mainpage_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `icon_class` varchar(50) DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  `contact_url` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mainpage_featured`
--

CREATE TABLE `mainpage_featured` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `orden` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mainpage_sliders`
--

CREATE TABLE `mainpage_sliders` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_url` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `orden` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `codigo` int(11) NOT NULL,
  `cif` varchar(10) NOT NULL,
  `dni` varchar(20) DEFAULT NULL COMMENT 'Documento Nacional de Identidad o equivalente',
  `apellidos` varchar(50) DEFAULT NULL,
  `nombres` varchar(50) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `mail` varchar(100) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `rol` enum('administrador','usuario','cajero','empresa','marketing') NOT NULL DEFAULT 'usuario',
  `creado_en` datetime DEFAULT current_timestamp(),
  `status` tinyint(4) NOT NULL DEFAULT 1,
  `puntos` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `propiedades`
--

CREATE TABLE `propiedades` (
  `caracteristicas_vivienda` set('terraza','balcón','huerto','césped','jardín','estanque','marquesina','piscina') DEFAULT NULL,
  `animales` set('sin animales','perro(s)','gato(s)','pájaro(s)','pez (peces)','roedor(es)','otros','animales de corral') DEFAULT NULL,
  `descripcion_vivienda` text DEFAULT NULL,
  `superficie_terreno` int(11) DEFAULT NULL,
  `codigo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas`
--

CREATE TABLE `recompensas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `puntos` int(11) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `categoria` varchar(50) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `canjeo_multiple` tinyint(1) NOT NULL DEFAULT 0,
  `expiracion_activa` tinyint(1) NOT NULL DEFAULT 0,
  `duracion_meses` int(11) DEFAULT 1,
  `cooldown_horas` int(11) DEFAULT 24,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `backup_config`
--

CREATE TABLE IF NOT EXISTS `backup_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` longtext NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key_unique` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Datos iniciales para la tabla `backup_config`
--

INSERT INTO `backup_config` (`config_key`, `config_value`, `description`) VALUES
('system_enabled', 'true', 'Habilitar/deshabilitar el sistema de backup'),
('database_backup', '{"enabled":true,"schedule":"daily","time":"02:00","dayOfWeek":1,"dayOfMonth":1,"retention":30,"compression":"gzip","includeStoredProcedures":true,"includeTriggers":true,"includeEvents":false,"singleTransaction":true,"addDropStatements":true}', 'Configuración de backup de base de datos'),
('files_backup', '{"enabled":true,"schedule":"weekly","time":"03:00","dayOfWeek":0,"dayOfMonth":1,"retention":14,"compression":"gzip","includeUploads":true,"includeConfig":true,"includeLogs":false,"excludePatterns":["*.log","node_modules",".git"]}', 'Configuración de backup de archivos'),
('storage_local', '{"enabled":true,"path":"/backups","maxSize":5000}', 'Configuración de almacenamiento local'),
('storage_ftp', '{"enabled":false,"host":"","port":21,"username":"","password":"","remotePath":"/backups","passiveMode":true}', 'Configuración de almacenamiento FTP'),
('storage_s3', '{"enabled":false,"accessKey":"","secretKey":"","bucket":"","region":"eu-west-1","endpoint":""}', 'Configuración de almacenamiento S3'),
('storage_google_drive', '{"enabled":false,"credentials":"","folderId":""}', 'Configuración de Google Drive'),
('encryption', '{"enabled":false,"password":""}', 'Configuración de cifrado'),
('notifications', '{"enabled":true,"emailOnSuccess":false,"emailOnFailure":true,"emailRecipients":[],"webhookUrl":"","webhookEvents":[]}', 'Configuración de notificaciones'),
('maintenance', '{"autoCleanup":true,"cleanupRetention":30,"verifyIntegrity":true,"testRestoration":false}', 'Configuración de mantenimiento');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `backup_logs`
--

CREATE TABLE IF NOT EXISTS `backup_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `backup_type` enum('database','files','full') NOT NULL,
  `status` enum('in_progress','success','failed') NOT NULL DEFAULT 'in_progress',
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `compressed` tinyint(1) NOT NULL DEFAULT 0,
  `encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `tables_count` int(11) DEFAULT NULL,
  `records_count` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_type` (`backup_type`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `backup_scheduled`
--

CREATE TABLE IF NOT EXISTS `backup_scheduled` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `backup_type` enum('database','files','full') NOT NULL,
  `schedule` enum('hourly','daily','weekly','monthly') NOT NULL,
  `time` time NOT NULL DEFAULT '02:00:00',
  `day_of_week` tinyint(1) DEFAULT NULL,
  `day_of_month` tinyint(2) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `last_run` datetime DEFAULT NULL,
  `next_run` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Datos iniciales para la tabla `backup_scheduled`
--

INSERT INTO `backup_scheduled` (`backup_type`, `schedule`, `time`, `day_of_week`, `day_of_month`, `enabled`) VALUES
('database', 'daily', '02:00:00', NULL, NULL, 1),
('files', 'weekly', '03:00:00', 0, NULL, 1),
('full', 'monthly', '01:00:00', NULL, 1, 1);

--
-- Estructura de tabla para la tabla `pet_cards`
--

CREATE TABLE IF NOT EXISTS `pet_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `petName` VARCHAR(255) NOT NULL,
  `petType` VARCHAR(100) NOT NULL,
  `productName` VARCHAR(255) NOT NULL DEFAULT 'No especificado',
  `stamps` INT NOT NULL DEFAULT 0,
  `stamp_dates` JSON COMMENT 'Array JSON con las fechas de los sellos añadidos',
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `expirationDate` DATETIME NULL COMMENT 'Fecha de caducidad - 6 meses desde el último sello',
  `isExpired` TINYINT(1) NULL DEFAULT 0 COMMENT 'Marca si el carnet ha expirado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `canjes_recompensas`
--
ALTER TABLE `canjes_recompensas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `persona_id` (`persona_id`),
  ADD KEY `recompensa_id` (`recompensa_id`);

--
-- Indices de la tabla `config_default_puntos`
--
ALTER TABLE `config_default_puntos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD KEY `codigo` (`codigo`);

--
-- Indices de la tabla `logs_admin`
--
ALTER TABLE `logs_admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indices de la tabla `logs_auth`
--
ALTER TABLE `logs_auth`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `logs_export`
--
ALTER TABLE `logs_export`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `logs_points`
--
ALTER TABLE `logs_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `actor_id` (`actor_id`),
  ADD KEY `persona_id` (`persona_id`);

--
-- Indices de la tabla `puntos_caducidad`
--
ALTER TABLE `puntos_caducidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `persona_id` (`persona_id`);

--
-- Indices de la tabla `logs_rewards`
--
ALTER TABLE `logs_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reward_id` (`reward_id`);

--
-- Indices de la tabla `mainpage_featured`
--
ALTER TABLE `mainpage_featured`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mainpage_sliders`
--
ALTER TABLE `mainpage_sliders`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`codigo`),
  ADD UNIQUE KEY `cif` (`cif`),
  ADD UNIQUE KEY `dni_unique` (`dni`);

--
-- Indices de la tabla `propiedades`
--
ALTER TABLE `propiedades`
  ADD KEY `codigo` (`codigo`);

--
-- Indices de la tabla `recompensas`
--
ALTER TABLE `recompensas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `codigos_barras`
--
ALTER TABLE `codigos_barras`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `recompensa_id` (`recompensa_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `canjes_recompensas`
--
ALTER TABLE `canjes_recompensas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `config_default_puntos`
--
ALTER TABLE `config_default_puntos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_admin`
--
ALTER TABLE `logs_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_auth`
--
ALTER TABLE `logs_auth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_export`
--
ALTER TABLE `logs_export`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_points`
--
ALTER TABLE `logs_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `puntos_caducidad`
--
ALTER TABLE `puntos_caducidad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs_rewards`
--
ALTER TABLE `logs_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mainpage_cards`
--
ALTER TABLE `mainpage_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mainpage_featured`
--
ALTER TABLE `mainpage_featured`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mainpage_sliders`
--
ALTER TABLE `mainpage_sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `codigo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recompensas`
--
ALTER TABLE `recompensas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `codigos_barras`
--
ALTER TABLE `codigos_barras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `config_niveles_cliente`
--
ALTER TABLE `config_niveles_cliente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `canjes_recompensas`
--
ALTER TABLE `canjes_recompensas`
  ADD CONSTRAINT `canjes_recompensas_persona_fk` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `canjes_recompensas_recompensa_fk` FOREIGN KEY (`recompensa_id`) REFERENCES `recompensas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD CONSTRAINT `direcciones_ibfk_1` FOREIGN KEY (`codigo`) REFERENCES `personas` (`codigo`);

--
-- Filtros para la tabla `logs_admin`
--
ALTER TABLE `logs_admin`
  ADD CONSTRAINT `logs_admin_admin_fk` FOREIGN KEY (`admin_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `logs_auth`
--
ALTER TABLE `logs_auth`
  ADD CONSTRAINT `logs_auth_user_fk` FOREIGN KEY (`user_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `logs_export`
--
ALTER TABLE `logs_export`
  ADD CONSTRAINT `logs_export_user_fk` FOREIGN KEY (`user_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `logs_points`
--
ALTER TABLE `logs_points`
  ADD CONSTRAINT `logs_points_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `logs_points_persona_fk` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `logs_rewards`
--
ALTER TABLE `logs_rewards`
  ADD CONSTRAINT `logs_rewards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE,
  ADD CONSTRAINT `logs_rewards_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `recompensas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `propiedades`
--
ALTER TABLE `propiedades`
  ADD CONSTRAINT `propiedades_ibfk_1` FOREIGN KEY (`codigo`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `puntos_caducidad`
--
ALTER TABLE `puntos_caducidad`
  ADD CONSTRAINT `puntos_caducidad_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`codigo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `codigos_barras`
--
ALTER TABLE `codigos_barras`
  ADD CONSTRAINT `codigos_barras_ibfk_1` FOREIGN KEY (`recompensa_id`) REFERENCES `recompensas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pet_cards`
--
ALTER TABLE `pet_cards`
  ADD CONSTRAINT `pet_cards_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `personas`(`codigo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------

--

-- Estructura de tabla para la tabla `password_reset_tokens`

--

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_unique` (`token`),
  INDEX `idx_token` (`token`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_carnet_mascota`
-- Tabla para almacenar los productos disponibles para generar carnets de mascotas
--

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

-- AUTO_INCREMENT para la tabla productos_carnet_mascota
ALTER TABLE `productos_carnet_mascota`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

