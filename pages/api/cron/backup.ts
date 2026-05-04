/**
 * API de Cron para Backups Automáticos Programados
 * 
 * Esta API ejecuta los backups programados cuando se llama con el token correcto.
 * 
 * Uso:
 *   GET /api/cron/backup?token=SECRET_CRON_TOKEN
 * 
 * Configuración del cron externo:
 *   - cron-job.org: Configurar llamada cada hora
 *   - Crontab: 0 * * * * curl "https://tu-dominio.com/api/cron/backup?token=SECRET_TOKEN"
 *   - Vercel Cron Jobs: Configurar en vercel.json
 */

import { NextApiRequest, NextApiResponse } from "next";
import executeQuery from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";
import { sendBackupNotification } from "@/lib/backupNotifications";
import { encryptFile } from "@/lib/backupEncryption";

const execAsync = promisify(exec);

// Detectar si estamos en Windows
const isWindows = os.platform() === "win32";

// Token de seguridad para el cron
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || process.env.BACKUP_CRON_SECRET;

interface BackupSchedule {
  id: number;
  name: string;
  backup_type: "database" | "files" | "full";
  schedule_type: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  enabled: boolean;
  last_run: Date | null;
  next_run: Date | null;
}

interface BackupConfig {
  database_backup?: {
    enabled: boolean;
    compression: string;
    includeStoredProcedures: boolean;
    includeTriggers: boolean;
    singleTransaction: boolean;
    addDropStatements: boolean;
  };
  files_backup?: {
    enabled: boolean;
    compression: string;
  };
  storage_local?: {
    enabled: boolean;
    path: string;
  };
  encryption?: {
    enabled: boolean;
    password: string;
  };
  [key: string]: any;
}

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDatabaseConnection(): DatabaseConfig {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "Club ViveVerde",
  };
}

/**
 * Verifica el token de seguridad
 */
function verifyToken(req: NextApiRequest): boolean {
  const providedToken = req.query.token as string;
  if (!CRON_SECRET_TOKEN) {
    console.warn("ADVERTENCIA: CRON_SECRET_TOKEN no está configurado. El endpoint está desprotegido.");
    return true;
  }
  return providedToken === CRON_SECRET_TOKEN;
}

/**
 * Obtiene la configuración de backup desde la base de datos
 */
async function getBackupConfig(): Promise<BackupConfig> {
  try {
    const rows = (await executeQuery({
      query: "SELECT config_key, config_value FROM backup_config",
      values: [],
    })) as any[];

    const config: BackupConfig = {};
    for (const row of rows) {
      try {
        config[row.config_key as keyof BackupConfig] = JSON.parse(row.config_value);
      } catch {
        config[row.config_key as keyof BackupConfig] = row.config_value;
      }
    }
    return config;
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return {};
  }
}

/**
 * Obtiene los backups programados que deben ejecutarse ahora
 */
async function getScheduledBackupsToRun(): Promise<BackupSchedule[]> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDayOfWeek = now.getDay();
  const currentDayOfMonth = now.getDate();

  // Solo ejecutar al inicio de cada hora (minuto 0)
  if (currentMinute !== 0) {
    return [];
  }

  try {
    const rows = (await executeQuery({
      query: "SELECT * FROM backup_scheduled WHERE enabled = 1",
      values: [],
    })) as any[];

    return rows.filter((row: any) => {
      const [schedHour] = (row.time || "00:00:00").split(":").map(Number);
      
      // Verificar si es la hora correcta
      if (schedHour !== currentHour) {
        return false;
      }

      // Verificar según el tipo de programación
      switch (row.schedule_type) {
        case "hourly":
          return true;
        case "daily":
          return true;
        case "weekly":
          return row.day_of_week === currentDayOfWeek;
        case "monthly":
          return row.day_of_month === currentDayOfMonth;
        default:
          return false;
      }
    }).map((row: any) => ({
      id: row.id,
      name: row.name,
      backup_type: row.backup_type,
      schedule_type: row.schedule_type,
      time: row.time,
      day_of_week: row.day_of_week,
      day_of_month: row.day_of_month,
      enabled: row.enabled === 1,
      last_run: row.last_run,
      next_run: row.next_run,
    }));
  } catch (error) {
    console.error("Error al obtener backups programados:", error);
    return [];
  }
}

/**
 * Calcula la próxima ejecución del backup
 */
function calculateNextRun(schedule: BackupSchedule): Date {
  const now = new Date();
  const [hours, minutes] = (schedule.time || "02:00:00").split(":").map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    switch (schedule.schedule_type) {
      case "hourly":
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        const daysUntilNext = (7 - now.getDay() + (schedule.day_of_week || 0)) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        if (schedule.day_of_month) {
          const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
          nextRun.setDate(Math.min(schedule.day_of_month, lastDayOfMonth));
        }
        break;
    }
  }

  return nextRun;
}

/**
 * Cifra el archivo de backup si está configurado
 */
async function encryptBackupIfNeeded(
  filePath: string,
  config: BackupConfig
): Promise<{ success: boolean; encrypted: boolean; newPath?: string; error?: string }> {
  if (!config.encryption?.enabled || !config.encryption?.password) {
    return { success: true, encrypted: false };
  }

  try {
    const encryptedFilePath = filePath + ".enc";
    const result = await encryptFile(filePath, encryptedFilePath, config.encryption.password);

    if (result.success) {
      fs.unlinkSync(filePath);
      return { success: true, encrypted: true, newPath: encryptedFilePath };
    }
    return { success: false, encrypted: false, error: result.error };
  } catch (error: any) {
    return { success: false, encrypted: false, error: error.message };
  }
}

/**
 * Crea backup de base de datos en Linux
 */
async function createDatabaseBackupLinux(
  type: string,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; checksum?: string; error?: string }> {
  const startTime = Date.now();
  const compression = config.database_backup?.compression || "gzip";
  const extension = compression === "gzip" ? "sql.gz" : compression === "bzip2" ? "sql.bz2" : "sql";
  const fileName = `backup_${type}_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  const dbConfig = getDatabaseConnection();
  let mysqldumpOptions = "";
  if (config.database_backup?.singleTransaction) mysqldumpOptions += " --single-transaction";
  if (config.database_backup?.addDropStatements) mysqldumpOptions += " --add-drop-table";
  if (config.database_backup?.includeStoredProcedures) mysqldumpOptions += " --routines";
  if (config.database_backup?.includeTriggers) mysqldumpOptions += " --triggers";

  const escapedPassword = dbConfig.password.replace(/'/g, "'\\''");
  const mysqldumpCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p'${escapedPassword}'` : ""} ${mysqldumpOptions} "${dbConfig.database}"`;

  let compressCmd = "";
  if (compression === "gzip") compressCmd = "gzip -9";
  else if (compression === "bzip2") compressCmd = "bzip2 -9";

  const fullCommand = compressCmd ? `${mysqldumpCmd} | ${compressCmd} > "${filePath}"` : `${mysqldumpCmd} > "${filePath}"`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error("El archivo de backup no fue creado");
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Cifrar si está configurado
    let finalPath = filePath;
    let finalChecksum = checksum;
    const encryptResult = await encryptBackupIfNeeded(filePath, config);
    if (encryptResult.success && encryptResult.encrypted && encryptResult.newPath) {
      finalPath = encryptResult.newPath;
      finalChecksum = crypto.createHash("sha256").update(fs.readFileSync(finalPath)).digest("hex");
    }

    const finalStats = fs.statSync(finalPath);

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, ?, 0, NOW())
      `,
      values: [type, finalPath, finalStats.size, duration, finalChecksum, compression !== "none" ? 1 : 0, encryptResult.encrypted ? 1 : 0],
    });

    return { success: true, filePath: finalPath, size: finalStats.size, checksum: finalChecksum };
  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    await executeQuery({
      query: `INSERT INTO backup_logs (backup_type, status, error_message, duration_seconds, created_by, completed_at) VALUES (?, 'failed', ?, ?, 0, NOW())`,
      values: [type, error.message, duration],
    });
    return { success: false, error: error.message };
  }
}

/**
 * Crea backup de archivos en Linux
 */
async function createFilesBackupLinux(
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; checksum?: string; error?: string }> {
  const startTime = Date.now();
  const compression = config.files_backup?.compression || "gzip";
  const extension = compression === "gzip" ? "tar.gz" : compression === "bzip2" ? "tar.bz2" : "tar";
  const fileName = `backup_app_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  const appRootDir = process.cwd();
  const excludePatterns = ["node_modules", ".git", ".next"];
  const excludeFlags = excludePatterns.map(p => `--exclude=${p}`).join(" ");

  let compressCmd = "";
  if (compression === "gzip") compressCmd = "gzip -9";
  else if (compression === "bzip2") compressCmd = "bzip2 -9";

  const tarCmd = `tar -cf - -C "${appRootDir}" ${excludeFlags} .`;
  const fullCommand = compressCmd ? `${tarCmd} | ${compressCmd} > "${filePath}"` : `${tarCmd} > "${filePath}"`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error("El archivo de backup no fue creado");
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Cifrar si está configurado
    let finalPath = filePath;
    let finalChecksum = checksum;
    const encryptResult = await encryptBackupIfNeeded(filePath, config);
    if (encryptResult.success && encryptResult.encrypted && encryptResult.newPath) {
      finalPath = encryptResult.newPath;
      finalChecksum = crypto.createHash("sha256").update(fs.readFileSync(finalPath)).digest("hex");
    }

    const finalStats = fs.statSync(finalPath);

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES ('files', 'success', ?, ?, ?, ?, ?, ?, 0, NOW())
      `,
      values: [finalPath, finalStats.size, duration, finalChecksum, compression !== "none" ? 1 : 0, encryptResult.encrypted ? 1 : 0],
    });

    return { success: true, filePath: finalPath, size: finalStats.size, checksum: finalChecksum };
  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    await executeQuery({
      query: `INSERT INTO backup_logs (backup_type, status, error_message, duration_seconds, created_by, completed_at) VALUES ('files', 'failed', ?, ?, 0, NOW())`,
      values: [error.message, duration],
    });
    return { success: false, error: error.message };
  }
}

/**
 * Ejecuta un backup programado
 */
async function executeScheduledBackup(schedule: BackupSchedule): Promise<{ success: boolean; error?: string }> {
  const config = await getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = config.storage_local?.path || "backups";

  let fullBackupDir: string;
  if (backupDir.startsWith("/")) {
    fullBackupDir = backupDir;
  } else {
    fullBackupDir = path.join(process.cwd(), backupDir);
  }

  const subDir = path.join(fullBackupDir, schedule.backup_type === "files" ? "Aplicacion" : "Base_datos");

  try {
    fs.mkdirSync(fullBackupDir, { recursive: true });
    fs.mkdirSync(subDir, { recursive: true });
  } catch (error) {
    return { success: false, error: `No se pudo crear el directorio: ${error}` };
  }

  if (isWindows) {
    return { success: false, error: "Windows no soportado para backups automáticos" };
  }

  try {
    let result;
    if (schedule.backup_type === "database") {
      result = await createDatabaseBackupLinux(schedule.backup_type, subDir, timestamp, config);
    } else if (schedule.backup_type === "files") {
      result = await createFilesBackupLinux(subDir, timestamp, config);
    } else {
      // Full backup
      const dbResult = await createDatabaseBackupLinux("database", subDir, timestamp, config);
      const filesResult = await createFilesBackupLinux(subDir, timestamp, config);
      result = {
        success: dbResult.success && filesResult.success,
        error: !dbResult.success ? dbResult.error : !filesResult.success ? filesResult.error : undefined,
        filePath: dbResult.filePath,
        size: (dbResult.size || 0) + (filesResult.size || 0),
      };
    }

    // Actualizar última ejecución
    const nextRun = calculateNextRun(schedule);
    await executeQuery({
      query: "UPDATE backup_scheduled SET last_run = NOW(), next_run = ? WHERE id = ?",
      values: [nextRun.toISOString(), schedule.id],
    });

    // Enviar notificación
    try {
      await sendBackupNotification({
        type: schedule.backup_type,
        status: result.success ? "success" : "failed",
        filePath: result.filePath,
        size: result.size,
        error: result.error,
      });
    } catch (notifyError) {
      console.error("Error al enviar notificación:", notifyError);
    }

    return { success: result.success, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Handler principal
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar método
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  // Verificar token
  if (!verifyToken(req)) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }

  const startTime = Date.now();
  console.log(`[CRON BACKUP] Iniciando verificación de backups programados - ${new Date().toISOString()}`);

  try {
    // Obtener backups que deben ejecutarse
    const schedules = await getScheduledBackupsToRun();

    if (schedules.length === 0) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`[CRON BACKUP] No hay backups programados para ejecutar - ${duration}s`);

      // Registrar ejecución del cron
      await executeQuery({
        query: `INSERT INTO backup_logs (backup_type, status, error_message, duration_seconds, created_by, completed_at) VALUES ('cron', 'success', 'Sin backups programados para ejecutar', ?, 0, NOW())`,
        values: [duration],
      });

      return res.status(200).json({
        success: true,
        message: "No hay backups programados para esta hora",
        executed: 0,
        duration,
        timestamp: new Date().toISOString(),
      });
    }

    // Ejecutar cada backup programado
    const results = [];
    for (const schedule of schedules) {
      console.log(`[CRON BACKUP] Ejecutando: ${schedule.name} (${schedule.backup_type})`);
      
      const result = await executeScheduledBackup(schedule);
      results.push({
        name: schedule.name,
        type: schedule.backup_type,
        success: result.success,
        error: result.error,
      });

      console.log(`[CRON BACKUP] Resultado: ${result.success ? "ÉXITO" : "FALLO"} - ${result.error || ""}`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const successCount = results.filter(r => r.success).length;

    console.log(`[CRON BACKUP] Completado: ${successCount}/${schedules.length} exitosos en ${duration}s`);

    return res.status(200).json({
      success: true,
      message: `Backups ejecutados: ${successCount}/${schedules.length}`,
      executed: schedules.length,
      successful: successCount,
      failed: schedules.length - successCount,
      results,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON BACKUP] Error fatal:", error);

    const duration = Math.round((Date.now() - startTime) / 1000);
    await executeQuery({
      query: `INSERT INTO backup_logs (backup_type, status, error_message, duration_seconds, created_by, completed_at) VALUES ('cron', 'failed', ?, ?, 0, NOW())`,
      values: [error.message, duration],
    });

    return res.status(500).json({
      success: false,
      message: "Error al ejecutar backups programados",
      error: error.message,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}

export default handler;