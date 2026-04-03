-- ============================================
-- SISTEMA DE GESTIÓN DE SUSCRIPCIÓN Y CORREOS
-- Club ViveVerde - Base de Datos
-- ============================================

-- Configuración de la base de datos
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. TABLA: email_subscribers
-- Gestión de suscriptores al sistema de correos
-- ============================================
CREATE TABLE IF NOT EXISTS email_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    user_id INT NULL,
    status ENUM('active', 'unsubscribed', 'bounced') NOT NULL DEFAULT 'active',
    subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_subscribed_at (subscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABLA: email_templates
-- Plantillas de correo electrónico
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type ENUM('welcome', 'newsletter', 'promotion', 'notification', 'reminder', 'birthday', 'confirmation', 'custom') NOT NULL DEFAULT 'custom',
    subject VARCHAR(500) NOT NULL,
    preheader VARCHAR(255) NULL,
    content TEXT NOT NULL,
    variables JSON NULL,
    styles TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABLA: email_campaigns
-- Campañas de correo electrónico
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    preheader VARCHAR(255) NULL,
    content TEXT NULL,
    type ENUM('newsletter', 'promotion', 'notification', 'reminder', 'birthday', 'welcome', 'segment', 'automated') NOT NULL DEFAULT 'newsletter',
    description TEXT NULL,
    template_id INT NULL,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
    segment_id INT NULL,
    scheduled_at DATETIME NULL,
    filter_criteria JSON NULL,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    total_recipients INT NOT NULL DEFAULT 0,
    total_sent INT NOT NULL DEFAULT 0,
    total_opened INT NOT NULL DEFAULT 0,
    total_clicked INT NOT NULL DEFAULT 0,
    total_bounced INT NOT NULL DEFAULT 0,
    total_unsubscribed INT NOT NULL DEFAULT 0,
    open_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    click_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_template_id (template_id),
    INDEX idx_segment_id (segment_id),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (segment_id) REFERENCES email_segments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABLA: email_segments
-- Segmentos de suscriptores
-- ============================================
CREATE TABLE IF NOT EXISTS email_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    filters JSON NOT NULL,
    query_preview TEXT NULL,
    estimated_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABLA: email_campaign_recipients
-- Receptores individuales de campañas
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    recipient_id INT NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'opened', 'clicked') NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    error_message TEXT NULL,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES email_subscribers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TABLA: email_automations
-- Automatizaciones de correo electrónico
-- ============================================
CREATE TABLE IF NOT EXISTS email_automations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    trigger_type ENUM('signup', 'purchase', 'points_milestone', 'birthday', 'inactivity', 'anniversary', 'custom_date') NOT NULL,
    trigger_config JSON NOT NULL,
    template_id INT NOT NULL,
    delay_days INT NOT NULL DEFAULT 0,
    delay_hours INT NOT NULL DEFAULT 0,
    conditions JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_triggered INT NOT NULL DEFAULT 0,
    total_sent INT NOT NULL DEFAULT 0,
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_is_active (is_active),
    INDEX idx_template_id (template_id),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TABLA: automation_logs
-- Registro de ejecuciones de automatizaciones
-- ============================================
CREATE TABLE IF NOT EXISTS automation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT NOT NULL,
    subscriber_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT NULL,
    INDEX idx_automation_id (automation_id),
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_status (status),
    INDEX idx_executed_at (executed_at),
    FOREIGN KEY (automation_id) REFERENCES email_automations(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TABLA: email_statistics
-- Estadísticas agregadas de correo
-- ============================================
CREATE TABLE IF NOT EXISTS email_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    campaign_id INT NULL,
    total_sent INT NOT NULL DEFAULT 0,
    total_delivered INT NOT NULL DEFAULT 0,
    total_opened INT NOT NULL DEFAULT 0,
    total_clicked INT NOT NULL DEFAULT 0,
    total_bounced INT NOT NULL DEFAULT 0,
    total_unsubscribed INT NOT NULL DEFAULT 0,
    open_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    click_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    INDEX idx_date (date),
    INDEX idx_campaign_id (campaign_id),
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TABLA: email_logs
-- Logs de envíos de correo
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NULL,
    campaign_id INT NULL,
    automation_id INT NULL,
    email_type ENUM('campaign', 'automation', 'transactional') NOT NULL,
    status ENUM('sent', 'failed', 'bounced') NOT NULL,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_automation_id (automation_id),
    INDEX idx_email_type (email_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (automation_id) REFERENCES email_automations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TABLA: email_bounces
-- Registro de emails rebotados
-- ============================================
CREATE TABLE IF NOT EXISTS email_bounces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NOT NULL,
    campaign_id INT NULL,
    bounce_type ENUM('hard', 'soft') NOT NULL,
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_bounce_type (bounce_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. TABLA: email_unsubscribes
-- Registro de bajas de suscriptores
-- ============================================
CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NOT NULL,
    campaign_id INT NULL,
    reason VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. TABLA: email_verification_tokens
-- Tokens de verificación de email
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE PRUEBA: Plantillas de Email
-- ============================================
INSERT INTO email_templates (name, type, subject, content, is_active, description) VALUES
('Bienvenida Club ViveVerde', 'welcome', '¡Bienvenido/a a Club ViveVerde!', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #166534;">¡Bienvenido/a a Club ViveVerde!</h1>
    <p>Hola {{name}},</p>
    <p>Gracias por unirte a nuestra comunidad. Ahora forma parte del club de fidelización más verde de España.</p>
    <h3>¿Qué puedes hacer en Club ViveVerde?</h3>
    <ul>
        <li>Acumular puntos con cada compra</li>
        <li>Canjealos por recompensas exclusivas</li>
        <li>Acceder a descuentos en tienda</li>
        <li>Participar en promociones especiales</li>
    </ul>
    <p>¡Empieza a acumular puntos hoy mismo!</p>
</div>
', TRUE, 'Email de bienvenida para nuevos miembros'),

('Confirmación de Suscripción', 'confirmation', 'Confirma tu suscripción a Club ViveVerde', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #166534;">Confirma tu suscripción</h1>
    <p>Hola {{name}},</p>
    <p>Gracias por suscribirte a Club ViveVerde. Para confirmar tu suscripción, haz clic en el siguiente botón:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{confirmation_link}}" style="background-color: #166534; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmar suscripción
        </a>
    </div>
    <p>Si no solicitaste esta suscripción, puedes ignorar este email.</p>
</div>
', TRUE, 'Email de confirmación para nuevos suscriptores'),

('Recordatorio de Puntos', 'reminder', '¡Tienes puntos pendientes de usar!', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #166534;">¡No olvides tus puntos!</h1>
    <p>Hola {{name}},</p>
    <p>Tienes <strong>{{points}} puntos</strong> acumulados en tu cuenta.</p>
    <p>¿Sabías que puedes canjearlos por:</p>
    <ul>
        <li>Descuentos en tu próxima compra</li>
        <li>Productos exclusivos del club</li>
        <li>Experiencias especiales</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{rewards_link}}" style="background-color: #166534; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver recompensas disponibles
        </a>
    </div>
</div>
', TRUE, 'Recordatorio para usar puntos acumulados'),

('Alerta de Caducidad', 'notification', 'Tus puntos están por caducar', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #dc2626;">¡Atención! Tus puntos caducan pronto</h1>
    <p>Hola {{name}},</p>
    <p>Tienes <strong>{{points}} puntos</strong> que caducan el {{expiry_date}}.</p>
    <p>¡No dejes que se pierdan! Canjéalos antes de esa fecha.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{rewards_link}}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Canjear puntos ahora
        </a>
    </div>
</div>
', TRUE, 'Alerta cuando los puntos están próximos a caducar'),

('Felicitaciones de Cumpleaños', 'birthday', '¡Feliz Cumpleaños! Tenemos un regalo para ti', '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #166534;">¡Feliz Cumpleaños, {{name}}!</h1>
    <p>Desde Club ViveVerde queremos celebrarlo contigo.</p>
    <p>Te regalamos <strong>{{bonus_points}} puntos extra</strong> para que los disfrutes en tu día especial.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{rewards_link}}" style="background-color: #166534; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver regalos de cumpleaños
        </a>
    </div>
</div>
', TRUE, 'Email de felicitación de cumpleaños');

-- ============================================
-- DATOS DE PRUEBA: Segmentos
-- ============================================
INSERT INTO email_segments (name, description, filters, is_active) VALUES
('Todos los suscriptores activos', 'Usuarios suscritos con email activo', '{"status": "active"}', TRUE),
('Nuevos miembros', 'Usuarios registrados en los últimos 30 días', '{"registered_within_days": 30}', TRUE),
('Altos puntos', 'Usuarios con más de 1000 puntos', '{"min_points": 1000}', TRUE);

-- ============================================
-- DATOS DE PRUEBA: Automatizaciones
-- ============================================
INSERT INTO email_automations (name, trigger_type, trigger_config, template_id, delay_days, delay_hours, conditions, is_active) VALUES
('Bienvenida a nuevos miembros', 'signup', '{"action": "user_registered"}', 1, 0, 1, NULL, TRUE),
('Recordatorio semanal de puntos', 'inactivity', '{"days": 7}', 3, 7, 0, NULL, TRUE),
('Felicitaciones de cumpleaños', 'birthday', '{"send_on_birthday": true}', 5, 0, 0, NULL, TRUE),
('Alerta de caducidad de puntos', 'custom_date', '{"days_before_expiry": 7}', 4, 7, 0, NULL, TRUE);

-- ============================================
-- HABILITAR CLAVES FORÁNEAS
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- NOTAS:
-- 1. La tabla email_subscribers es la principal para gestionar suscripciones
-- 2. El campo 'status' indica si el usuario está 'active', 'unsubscribed' o 'bounced'
-- 3. La suscripción se considera parte del servicio de recompensas (base legal GDPR)
-- 4. Los usuarios dados de baja ('unsubscribed') pueden perder acceso a puntos
-- ============================================
