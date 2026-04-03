-- =============================================
-- SISTEMA DE GESTIÓN DE CORREOS - BASE DE DATOS
-- =============================================

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('newsletter', 'promotional', 'transactional', 'announcement', 'welcome', 'birthday', 'inactivity', 'reward') NOT NULL DEFAULT 'newsletter',
    variables JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de campañas de email
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    template_id INT,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'draft',
    scheduled_at DATETIME,
    sent_at DATETIME,
    total_recipients INT DEFAULT 0,
    successful_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    opens_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    unsubscribes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    segment_criteria JSON,
    automation_id INT,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (automation_id) REFERENCES email_automations(id) ON DELETE SET NULL
);

-- Tabla de suscriptores/usuários para emails
CREATE TABLE IF NOT EXISTS email_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    interests JSON,
    engagement_score INT DEFAULT 0,
    total_emails_received INT DEFAULT 0,
    total_emails_opened INT DEFAULT 0,
    last_email_opened_at DATETIME,
    email_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    is_subscribed BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    unsubscribed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email (email)
);

-- Tabla de automatizaciones
CREATE TABLE IF NOT EXISTS email_automations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type ENUM('signup', 'first_purchase', 'birthday', 'inactivity', 'points_milestone', 'reward_redeemed', 'anniversary', 'custom_date') NOT NULL,
    trigger_data JSON,
    template_id INT,
    delay_days INT DEFAULT 0,
    delay_hours INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de registro de emails enviados
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    subscriber_id INT,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed') NOT NULL DEFAULT 'pending',
    sent_at DATETIME,
    delivered_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    bounced_at DATETIME,
    bounced_reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE
);

-- Tabla de segmentos de usuarios
CREATE TABLE IF NOT EXISTS email_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSON NOT NULL,
    subscriber_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de preferencias de usuario para emails
CREATE TABLE IF NOT EXISTS email_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    newsletter BOOLEAN DEFAULT TRUE,
    promotional BOOLEAN DEFAULT TRUE,
    transactional BOOLEAN DEFAULT TRUE,
    announcements BOOLEAN DEFAULT TRUE,
    birthday_emails BOOLEAN DEFAULT TRUE,
    inactivity_emails BOOLEAN DEFAULT TRUE,
    reward_emails BOOLEAN DEFAULT TRUE,
    preferred_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- Tabla de estadísticas agregadas por fecha
CREATE TABLE IF NOT EXISTS email_daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    total_bounced INT DEFAULT 0,
    total_unsubscribed INT DEFAULT 0,
    avg_open_rate DECIMAL(5,2) DEFAULT 0,
    avg_click_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- =============================================
-- DATOS DE PRUEBA PARA PLANTILLAS
-- =============================================

INSERT INTO email_templates (name, subject, content, type, variables) VALUES
(
    'Bienvenida',
    '¡Bienvenido/a a Club ViveVerde! 🌿',
    '<h1>¡Bienvenido/a {{name}}!</h1>
    <p>Estamos encantados de tenerte con nosotros en <strong>Club ViveVerde</strong>.</p>
    <p>Como miembro, tendrás acceso a:</p>
    <ul>
        <li>Programa de puntos y recompensas</li>
        <li>Carné de mascota con sellos</li>
        <li>Ofertas exclusivas</li>
        <li>Comunicados especiales</li>
    </ul>
    <p>¡Comienza a acumular puntos hoy mismo!</p>
    <p>Saludos,<br>El equipo de Club ViveVerde</p>',
    'welcome',
    '["name", "pet_name", "member_id"]'
),
(
    'Boletín Semanal',
    '{{subject}} - Boletín Semanal Club ViveVerde',
    '<h2>¡Hola {{name}}!</h2>
    <p>Aquí tienes las novedades de esta semana en Club ViveVerde:</p>
    <hr>
    {{content}}
    <hr>
    <p><strong>Recuerda:</strong> Acumula sellos en tu carné de mascota y canjéalos por recompensas increíbles.</p>
    <p>¡Te esperamos!</p>',
    'newsletter',
    '["name", "subject", "content"]'
),
(
    'Recordatorio de Inactividad',
    '¡Te extrañamos, {{name}}! 😿',
    '<h2>¡Hola {{name}}!</h2>
    <p>Hemos notado que no nos has visitado últimamente. Tu mascota <strong>{{pet_name}}</strong> podría estar perdiendo sellos.</p>
    <p>¡Ven a visitarnos y sigue acumulando puntos!</p>
    <p>Tienes <strong>{{points}} puntos</strong> disponibles.</p>',
    'inactivity',
    '["name", "pet_name", "points", "days_inactive"]'
),
(
    'Cumpleaños',
    '🎉 ¡Feliz Cumpleaños, {{name}}!',
    '<h1>¡Feliz Cumpleaños, {{name}}!</h1>
    <p>En tu día especial, queremos darte un regalo:</p>
    <p><strong>¡50 puntos extra en tu cuenta!</strong></p>
    <p>Ven a celebrarlo con nosotros.</p>',
    'birthday',
    '["name", "pet_name", "bonus_points"]'
),
(
    'Nueva Recompensa',
    '¡Nueva recompensa disponible! 🎁',
    '<h2>¡Hola {{name}}!</h2>
    <p>Tenemos una nueva recompensa esperándote:</p>
    <h3>{{reward_name}}</h3>
    <p>{{reward_description}}</p>
    <p><strong>Coste: {{reward_points}} puntos</strong></p>
    <p>¡No te la pierdas!</p>',
    'promotional',
    '["name", "reward_name", "reward_description", "reward_points", "reward_image"]'
);

-- =============================================
-- DATOS DE PRUEBA PARA AUTOMATIZACIONES
-- =============================================

INSERT INTO email_automations (name, description, trigger_type, trigger_data, template_id, delay_days, delay_hours) VALUES
(
    'Bienvenida a nuevos miembros',
    'Envía un email de bienvenida cuando un usuario se registra',
    'signup',
    '{"action": "user_registered"}',
    1,
    0,
    1
),
(
    'Recordatorio de inactividad 7 días',
    'Envía recordatorio después de 7 días de inactividad',
    'inactivity',
    '{"days": 7}',
    3,
    7,
    0
),
(
    'Felicitaciones de cumpleaños',
    'Envía felicitación el día del cumpleaños del usuario',
    'birthday',
    '{"send_on_birthday": true}',
    4,
    0,
    0
),
(
    'Recompensa canjeada',
    'Confirma cuando el usuario canjea una recompensa',
    'reward_redeemed',
    '{"action": "reward_redeemed"}',
    NULL,
    0,
    0
);
