-- =============================================
-- MODIFICACIÓN 5: VERIFICAR/AÑADIR CAMPOS DE EMAIL EN USUARIOS
-- =============================================

USE `Club ViveVerde`;

-- PASO 1: Verificar si la tabla personas tiene el campo mail
DESCRIBE personas;

-- PASO 2: Verificar si la tabla email_preferences existe
SHOW TABLES LIKE 'email_preferences';

-- PASO 3: Si email_preferences NO existe, crearla correctamente
CREATE TABLE IF NOT EXISTS email_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Referencia a personas.codigo',
    newsletter BOOLEAN DEFAULT TRUE,
    promotional BOOLEAN DEFAULT TRUE,
    transactional BOOLEAN DEFAULT TRUE,
    announcements BOOLEAN DEFAULT TRUE,
    birthday_emails BOOLEAN DEFAULT TRUE,
    inactivity_emails BOOLEAN DEFAULT TRUE,
    reward_emails BOOLEAN DEFAULT TRUE,
    welcome_emails BOOLEAN DEFAULT TRUE,
    preferred_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- PASO 4: Si email_preferences YA existe con FK a users, alteration para vincularla a personas
-- Descomenta solo si necesitas modificar una tabla existente

-- ALTER TABLE email_preferences
-- DROP FOREIGN KEY email_preferences_ibfk_1;

-- ALTER TABLE email_preferences
-- MODIFY COLUMN user_id INT NOT NULL COMMENT 'Referencia a personas.codigo';

-- ALTER TABLE email_preferences
-- ADD CONSTRAINT fk_email_preferences_persona
-- FOREIGN KEY (user_id) REFERENCES personas(codigo) ON DELETE CASCADE;

-- PASO 5: Verificar usuarios con email válido
SELECT codigo, nombres, apellidos, mail FROM personas WHERE mail IS NOT NULL AND mail != '' LIMIT 10;

-- PASO 6: Crear preferencias por defecto para usuarios sin preferencias
INSERT INTO email_preferences (user_id, newsletter, promotional, transactional, announcements, birthday_emails, inactivity_emails, reward_emails, welcome_emails)
SELECT codigo, 1, 1, 1, 1, 1, 1, 1, 1 FROM personas p
WHERE NOT EXISTS (SELECT 1 FROM email_preferences ep WHERE ep.user_id = p.codigo);

-- PASO 7: Verificar las preferencias creadas
SELECT ep.user_id, ep.reward_emails, ep.newsletter, p.nombres, p.mail
FROM email_preferences ep
JOIN personas p ON p.codigo = ep.user_id
LIMIT 10;
