-- =============================================
-- SISTEMA DE GESTIÓN DE CORREOS - BASE DE DATOS
-- =============================================

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('newsletter', 'promotional', 'transactional', 'announcement', 'welcome', 'birthday', 'inactivity', 'reward', 'reward_confirmation') NOT NULL DEFAULT 'newsletter',
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
),
(
    'Confirmación de Canje de Recompensa',
    '¡Canje exitoso! - {{reward_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .reward-box { background-color: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .reward-name { font-size: 20px; font-weight: bold; color: #2e7d32; margin-bottom: 10px; }
        .points-used { font-size: 16px; color: #666; }
        .points-remain { font-size: 14px; color: #888; margin-top: 10px; }
        .barcode-section { background-color: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .barcode-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #333; letter-spacing: 2px; }
        .instructions { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        .instructions h3 { margin: 0 0 10px 0; color: #e65100; }
        .instructions ul { margin: 0; padding-left: 20px; color: #555; }
        .instructions li { margin: 5px 0; }
        .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Felicidades, {{name}}! 🎉</h1>
        </div>
        <div class="content">
            <p>Tu canje se ha realizado exitosamente. Aquí tienes los detalles de tu recompensa:</p>
            
            <div class="reward-box">
                <div class="reward-name">{{reward_name}}</div>
                <div class="points-used">Canjeaste {{points_spent}} puntos</div>
                <div class="points-remain">Te quedan {{remaining_points}} puntos en tu cuenta</div>
            </div>
            
            <div class="barcode-section">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Código para reclamar tu recompensa:</p>
                <div class="barcode-code">{{codigo_barras}}</div>
            </div>
            
            <div class="instructions">
                <h3>¿Cómo reclamar tu recompensa?</h3>
                <ul>
                    <li>Muestra este email o el código anterior en cualquiera de nuestros puntos de venta</li>
                    <li>El código es válido hasta el {{expiration_date}}</li>
                    <li>Si tienes alguna duda, contacta con nuestro equipo en soporte@viveverde.es</li>
                </ul>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
                Canje realizado el {{date}}<br>
                Número de referencia: {{redemption_id}}
            </p>
        </div>
        <div class="footer">
            <p>Club ViveVerde - Programa de Fidelización</p>
            <p>Este email es informativo. No respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>',
    'reward_confirmation',
    '["name", "reward_name", "points_spent", "remaining_points", "codigo_barras", "expiration_date", "date", "redemption_id"]'
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
    6,
    0,
    0
);
