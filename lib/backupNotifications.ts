/**
 * Módulo de notificaciones para el sistema de backup
 * Maneja envío de emails y llamadas a webhooks
 */

import nodemailer from "nodemailer";
import executeQuery from "@/lib/db";

// Configuración de email
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Configuración de notificación
interface NotificationConfig {
  enabled: boolean;
  emailOnSuccess: boolean;
  emailOnFailure: boolean;
  emailRecipients: string[];
  webhookUrl: string;
  webhookEvents: string[];
}

// Tipo de evento de backup
type BackupEvent = "backup_started" | "backup_completed" | "backup_failed" | "restore_started" | "restore_completed" | "restore_failed";

// Resultado de un backup
interface BackupResult {
  type: string;
  status: "success" | "failed" | "in_progress";
  filePath?: string;
  size?: number;
  error?: string;
  durationSeconds?: number;
}

/**
 * Obtiene la configuración de notificaciones desde la base de datos
 */
async function getNotificationConfig(): Promise<NotificationConfig> {
  try {
    const rows = (await executeQuery({
      query: "SELECT config_key, config_value FROM backup_config WHERE config_key = 'notifications'",
      values: [],
    })) as any[];

    if (rows && rows.length > 0) {
      try {
        return JSON.parse(rows[0].config_value);
      } catch {
        // Configuración por defecto
      }
    }
  } catch (error) {
    console.error("Error al obtener configuración de notificaciones:", error);
  }

  // Valores por defecto
  return {
    enabled: false,
    emailOnSuccess: false,
    emailOnFailure: true,
    emailRecipients: [],
    webhookUrl: "",
    webhookEvents: ["backup_started", "backup_completed", "backup_failed"],
  };
}

/**
 * Obtiene la configuración de email desde variables de entorno
 */
function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || process.env.EMAIL_SECURE === "true";
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.warn("Configuración de email no disponible. Variables SMTP/EMAIL no configuradas.");
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

/**
 * Formatea bytes a string legible
 */
function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Envía un email usando nodemailer
 */
async function sendEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; error?: string }> {
  const emailConfig = getEmailConfig();
  
  if (!emailConfig) {
    console.warn("No se puede enviar email: configuración no disponible");
    return { success: false, error: "Configuración de email no disponible" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || "noreply@clubviveverde.com",
      to: recipients.join(", "),
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("Error al enviar email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía una petición HTTP a un webhook
 */
async function sendWebhook(
  url: string,
  event: BackupEvent,
  data: {
    backupType?: string;
    status?: string;
    filePath?: string;
    size?: number;
    error?: string;
    timestamp: string;
    durationSeconds?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!url) {
    return { success: false, error: "URL de webhook no configurada" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Backup-Event": event,
        "X-Backup-Timestamp": data.timestamp,
      },
      body: JSON.stringify({
        event,
        timestamp: data.timestamp,
        data,
      }),
    });

    if (!response.ok) {
      console.warn(`Webhook responded with status ${response.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error al enviar webhook:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el contenido HTML del email de notificación
 */
function generateEmailContent(
  event: BackupEvent,
  result: BackupResult,
  timestamp: string
): { subject: string; html: string } {
  const isSuccess = result.status === "success";
  const typeLabels: Record<string, string> = {
    database: "Base de Datos",
    files: "Archivos",
    full: "Completo",
    restore: "Restauración",
  };

  const statusLabels: Record<string, string> = {
    success: "Completado Exitosamente",
    failed: "Fallido",
    in_progress: "En Progreso",
  };

  const eventLabels: Record<BackupEvent, string> = {
    backup_started: "Backup Iniciado",
    backup_completed: "Backup Completado",
    backup_failed: "Backup Fallido",
    restore_started: "Restauración Iniciada",
    restore_completed: "Restauración Completada",
    restore_failed: "Restauración Fallida",
  };

  const color = isSuccess ? "#10B981" : "#EF4444";
  const icon = isSuccess ? "✓" : "✗";
  const typeName = typeLabels[result.type] || result.type;

  const subject = `[Club ViveVerde] ${eventLabels[event]} - ${typeName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      ${icon} ${eventLabels[event]}
    </h1>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280;">Tipo:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${typeName}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280;">Estado:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: ${color}; font-weight: bold;">${statusLabels[result.status]}</span>
        </td>
      </tr>
      ${result.size ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280;">Tamaño:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatBytes(result.size)}
        </td>
      </tr>
      ` : ""}
      ${result.durationSeconds ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280;">Duración:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${result.durationSeconds} segundos
        </td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px 0;">
          <strong style="color: #6b7280;">Fecha/Hora:</strong>
        </td>
        <td style="padding: 10px 0; text-align: right;">
          ${new Date(timestamp).toLocaleString("es-ES")}
        </td>
      </tr>
    </table>
    
    ${result.error ? `
    <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-top: 15px;">
      <strong style="color: #dc2626;">Error:</strong>
      <p style="color: #991b1b; margin: 5px 0 0 0;">${result.error}</p>
    </div>
    ` : ""}
    
    ${result.filePath ? `
    <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
      <strong style="color: #6b7280;">Archivo:</strong>
      <p style="color: #374151; margin: 5px 0 0 0; word-break: break-all;">${result.filePath}</p>
    </div>
    ` : ""}
  </div>
  
  <div style="background: #1f2937; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      Club ViveVerde - Sistema de Copias de Seguridad
    </p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Mapea el evento según el tipo de backup y estado
 */
function mapBackupEvent(type: string, status: string): BackupEvent {
  if (type === "restore") {
    return status === "success" ? "restore_completed" : "restore_failed";
  }
  return status === "success" ? "backup_completed" : "backup_failed";
}

/**
 * Función principal para enviar notificaciones de backup
 */
export async function sendBackupNotification(
  result: BackupResult,
  timestamp?: string
): Promise<{ emailSent: boolean; webhookSent: boolean; errors?: string[] }> {
  const config = await getNotificationConfig();
  const now = timestamp || new Date().toISOString();
  const errors: string[] = [];
  let emailSent = false;
  let webhookSent = false;

  // Si las notificaciones están deshabilitadas, salir
  if (!config.enabled) {
    return { emailSent: false, webhookSent: false };
  }

  // Determinar el evento
  const event = mapBackupEvent(result.type, result.status);

  // Verificar si debemos enviar según el evento configurado
  const shouldNotify =
    (result.status === "success" && config.emailOnSuccess) ||
    (result.status === "failed" && config.emailOnFailure);

  if (!shouldNotify) {
    return { emailSent: false, webhookSent: false };
  }

  // Enviar email si está configurado
  if (config.emailRecipients && config.emailRecipients.length > 0) {
    const { subject, html } = generateEmailContent(event, result, now);
    const emailResult = await sendEmail(config.emailRecipients, subject, html);

    if (emailResult.success) {
      emailSent = true;
    } else {
      errors.push(`Email: ${emailResult.error}`);
    }
  }

  // Enviar webhook si está configurado
  if (config.webhookUrl && config.webhookEvents.includes(event)) {
    const webhookResult = await sendWebhook(config.webhookUrl, event, {
      backupType: result.type,
      status: result.status,
      filePath: result.filePath,
      size: result.size,
      error: result.error,
      timestamp: now,
      durationSeconds: result.durationSeconds,
    });

    if (webhookResult.success) {
      webhookSent = true;
    } else {
      errors.push(`Webhook: ${webhookResult.error}`);
    }
  }

  return { emailSent, webhookSent, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Registra en los logs que se intentó enviar una notificación
 */
export async function logNotificationAttempt(
  event: string,
  emailSent: boolean,
  webhookSent: boolean,
  recipients?: string[],
  webhookUrl?: string
): Promise<void> {
  try {
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, error_message, file_path, file_size, created_by, completed_at)
        VALUES ('notification', 'success', ?, ?, 0, 0, NOW())
      `,
      values: [
        `Notificación ${event}: Email=${emailSent ? "OK" : "N/A"}, Webhook=${webhookSent ? "OK" : "N/A"}`,
        `Recipients: ${recipients?.join(", ") || "N/A"} | Webhook: ${webhookUrl || "N/A"}`,
      ],
    });
  } catch (error) {
    console.error("Error al registrar notificación:", error);
  }
}

export default {
  sendBackupNotification,
  logNotificationAttempt,
};
