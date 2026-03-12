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
(2, 'puntos_bienvenida', 5.00, CURRENT_TIMESTAMP());

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
  `apellidos` varchar(50) DEFAULT NULL,
  `nombres` varchar(50) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `mail` varchar(100) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `rol` enum('administrador','usuario','cajero','empresa') NOT NULL DEFAULT 'usuario',
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
  `completed` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
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
  ADD UNIQUE KEY `cif` (`cif`);

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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;