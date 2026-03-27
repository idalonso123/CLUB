-- =============================================
-- TABLA DE LOGS DE AUTOMATIZACIONES
-- =============================================

CREATE TABLE IF NOT EXISTS automation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT NOT NULL,
    subscriber_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (automation_id) REFERENCES email_automations(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
    INDEX idx_automation_id (automation_id),
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
),
(
    'Primer compra realizada',
    'Envía email de agradecimiento tras primera compra',
    'first_purchase',
    '{"action": "first_purchase_completed"}',
    NULL,
    0,
    2
),
(
    'Milestone de puntos',
    'Felicita al usuario cuando alcanza ciertos puntos',
    'points_milestone',
    '{"milestones": [100, 500, 1000, 5000]}',
    NULL,
    0,
    0
),
(
    'Aniversario de membresía',
    'Felicita al usuario en su anniversario con el club',
    'anniversary',
    '{"years": [1, 2, 3, 5]}',
    NULL,
    0,
    0
),
(
    'Fecha personalizada',
    'Envía email en una fecha específica definida por el usuario',
    'custom_date',
    '{"custom_date_field": "membership_date"}',
    NULL,
    0,
    0
);
