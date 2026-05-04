import nodemailer from 'nodemailer';
import executeQuery from '@/lib/db';

/**
 * Servicio centralizado para el envío de emails
 * Proporciona funciones para enviar emails con plantillas personalizadas
 */

// Tipo para las variables de plantilla
export interface EmailVariables {
  [key: string]: string | number | undefined | null;
}

// Resultado del envío de email
export interface EmailSendResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

// Transporter configurado para emails automáticos
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Reemplaza las variables en una plantilla con sus valores
 * @param template - Plantilla con variables {{variable}}
 * @param variables - Objeto con los valores para cada variable
 * @returns Plantilla con variables reemplazadas
 */
export function replaceTemplateVariables(
  template: string,
  variables: EmailVariables
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = value !== undefined && value !== null ? String(value) : '';
    result = result.replace(regex, replacement);
  }
  
  return result;
}

/**
 * Obtiene una plantilla de email por su ID
 * @param templateId - ID de la plantilla
 * @returns Datos de la plantilla o null si no existe
 */
export async function getEmailTemplate(templateId: number): Promise<{
  id: number;
  name: string;
  subject: string;
  content: string;
  type: string;
} | null> {
  try {
    const result = await executeQuery({
      query: 'SELECT id, name, subject, content, type FROM email_templates WHERE id = ? AND is_active = 1',
      values: [templateId],
    }) as any[];
    
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('Error al obtener plantilla de email:', error);
    return null;
  }
}

/**
 * Obtiene los datos del usuario incluyendo email y nombre
 * @param userId - ID del usuario
 * @returns Datos del usuario o null si no existe
 */
export async function getUserEmailData(userId: number): Promise<{
  email: string;
  name: string;
  firstName: string;
  lastName: string;
} | null> {
  try {
    const result = await executeQuery({
      query: 'SELECT mail, nombres, apellidos FROM personas WHERE codigo = ?',
      values: [userId],
    }) as any[];
    
    if (result && result.length > 0) {
      const user = result[0];
      return {
        email: user.mail || '',
        name: `${user.nombres || ''} ${user.apellidos || ''}`.trim(),
        firstName: user.nombres || '',
        lastName: user.apellidos || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
}

/**
 * Verifica si el usuario tiene preferencia para recibir emails de recompensas
 * @param userId - ID del usuario
 * @returns true si puede recibir emails, false si ha desactivado las notificaciones
 */
export async function canSendRewardEmail(userId: number): Promise<boolean> {
  try {
    const result = await executeQuery({
      query: 'SELECT reward_emails FROM email_preferences WHERE user_id = ?',
      values: [userId],
    }) as any[];
    
    if (result && result.length > 0) {
      return result[0].reward_emails === 1;
    }
    // Por defecto, permitir el envío si no hay preferencias configuradas
    return true;
  } catch (error) {
    console.error('Error al verificar preferencias de email:', error);
    return true;
  }
}

/**
 * Registra el envío de un email en el log
 * @param emailData - Datos del email enviado
 */
export async function logEmailSent(emailData: {
  subscriberId?: number;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  subject: string;
  templateId?: number;
  campaignId?: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    await executeQuery({
      query: `
        INSERT INTO email_logs 
        (subscriber_id, email, status, sent_at, subject, campaign_id, error_message)
        VALUES (?, ?, ?, NOW(), ?, ?, ?)
      `,
      values: [
        emailData.subscriberId || null,
        emailData.email,
        emailData.status,
        emailData.subject,
        emailData.campaignId || null,
        emailData.errorMessage || null,
      ],
    });
  } catch (error) {
    console.error('Error al registrar log de email:', error);
  }
}

/**
 * Envía un email usando una plantilla existente
 * @param to - Email del destinatario
 * @param templateId - ID de la plantilla a usar
 * @param variables - Variables para reemplazar en la plantilla
 * @returns Resultado del envío
 */
export async function sendEmailWithTemplate(
  to: string,
  templateId: number,
  variables: EmailVariables
): Promise<EmailSendResult> {
  try {
    // Obtener la plantilla
    const template = await getEmailTemplate(templateId);
    if (!template) {
      return {
        success: false,
        message: 'Plantilla no encontrada',
        error: 'La plantilla especificada no existe o está desactivada',
      };
    }
    
    // Reemplazar variables en asunto y contenido
    const subject = replaceTemplateVariables(template.subject, variables);
    const content = replaceTemplateVariables(template.content, variables);
    
    // Crear transporter y enviar email
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Club ViveVerde <noreply@viveverde.es>',
      to,
      subject,
      html: content,
    });
    
    // Registrar en logs
    await logEmailSent({
      email: to,
      status: 'sent',
      subject,
      templateId,
      errorMessage: undefined,
    });
    
    return {
      success: true,
      message: 'Email enviado correctamente',
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al enviar email:', errorMessage);
    
    // Registrar error en logs
    await logEmailSent({
      email: to,
      status: 'failed',
      subject: variables.reward_name as string || 'Sin asunto',
      templateId,
      errorMessage,
    });
    
    return {
      success: false,
      message: 'Error al enviar el email',
      error: errorMessage,
    };
  }
}

/**
 * Envía un email de confirmación de canje de recompensa
 * @param userId - ID del usuario
 * @param rewardData - Datos de la recompensa canjeada
 * @returns Resultado del envío
 */
export async function sendRewardRedemptionEmail(
  userId: number,
  rewardData: {
    rewardName: string;
    pointsSpent: number;
    remainingPoints: number;
    codigoBarras: string;
    expirationDate?: string;
    redemptionId: number;
  }
): Promise<EmailSendResult> {
  try {
    // Obtener datos del usuario
    const userData = await getUserEmailData(userId);
    if (!userData || !userData.email) {
      return {
        success: false,
        message: 'Usuario no encontrado o sin email',
        error: 'No se pudo obtener la información del usuario',
      };
    }
    
    // Verificar preferencias del usuario
    const canSend = await canSendRewardEmail(userId);
    if (!canSend) {
      return {
        success: false,
        message: 'Usuario ha desactivado las notificaciones de recompensas',
        error: 'Preferencia de email desactivada',
      };
    }
    
    // Preparar variables para la plantilla
    const variables: EmailVariables = {
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      reward_name: rewardData.rewardName,
      points_spent: rewardData.pointsSpent,
      remaining_points: rewardData.remainingPoints,
      codigo_barras: rewardData.codigoBarras,
      expiration_date: rewardData.expirationDate || 'No expira',
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      redemption_id: rewardData.redemptionId.toString(),
    };
    
    // Enviar email usando la plantilla 6 (Confirmación de Canje de Recompensa)
    return await sendEmailWithTemplate(userData.email, 6, variables);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al enviar email de confirmación de canje:', errorMessage);
    return {
      success: false,
      message: 'Error al enviar el email de confirmación',
      error: errorMessage,
    };
  }
}

/**
 * Envía un email genérico sin usar plantilla
 * @param to - Email del destinatario
 * @param subject - Asunto del email
 * @param htmlContent - Contenido HTML del email
 * @returns Resultado del envío
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Club ViveVerde <noreply@viveverde.es>',
      to,
      subject,
      html: htmlContent,
    });
    
    await logEmailSent({
      email: to,
      status: 'sent',
      subject,
      errorMessage: undefined,
    });
    
    return {
      success: true,
      message: 'Email enviado correctamente',
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al enviar email:', errorMessage);
    
    await logEmailSent({
      email: to,
      status: 'failed',
      subject,
      errorMessage,
    });
    
    return {
      success: false,
      message: 'Error al enviar el email',
      error: errorMessage,
    };
  }
}

/**
 * Envía un email de prueba para verificar la configuración
 * @param to - Email de destino para la prueba
 * @returns Resultado del envío de prueba
 */
export async function sendTestEmail(to: string): Promise<EmailSendResult> {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email de Prueba - Club ViveVerde</h1>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                <h2>¡Configuración correcta!</h2>
                <p>Si estás viendo este email, significa que la configuración del servidor de correo está funcionando correctamente.</p>
                <p><strong>Fecha de prueba:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>
            <div class="footer">
                <p>Club ViveVerde - Programa de Fidelización</p>
                <p>Este es un email de prueba automático</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  return await sendEmail(
    to,
    '[Prueba] Configuración de Email - Club ViveVerde',
    testHtml
  );
}

export default {
  replaceTemplateVariables,
  getEmailTemplate,
  getUserEmailData,
  canSendRewardEmail,
  logEmailSent,
  sendEmailWithTemplate,
  sendRewardRedemptionEmail,
  sendEmail,
  sendTestEmail,
};