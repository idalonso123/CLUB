import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";
import { sendBackupNotification } from "@/lib/backupNotifications";
import { encryptFile } from "@/lib/backupEncryption";
import { uploadFileToSftp, testSftpConnection, SftpConfig } from "@/lib/backupSftp";

const execAsync = promisify(exec);

// Detectar si estamos en Windows
const isWindows = os.platform() === "win32";

interface BackupConfig {
  database_backup?: {
    enabled: boolean;
    retention: number;
    compression: string;
    includeStoredProcedures: boolean;
    includeTriggers: boolean;
    singleTransaction: boolean;
    addDropStatements: boolean;
  };
  files_backup?: {
    enabled: boolean;
    retention: number;
    compression: string;
    excludePatterns: string[];
  };
  storage_local?: {
    enabled: boolean;
    path: string;
    maxSize: number;
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

async function getBackupConfig(): Promise<BackupConfig> {
  try {
    const rows = (await executeQuery({
      query: "SELECT config_key, config_value FROM backup_config",
      values: [],
    })) as any[];

    const config: BackupConfig = {};

    for (const row of rows) {
      try {
        config[row.config_key as keyof BackupConfig] = JSON.parse(
          row.config_value
        );
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

// Tipo para resultado de backup
interface BackupResult {
  type: string;
  status: "success" | "failed" | "in_progress";
  filePath?: string;
  size?: number;
  error?: string;
  durationSeconds?: number;
}

// Función para cifrar archivo de backup si está configurado
async function encryptBackupIfNeeded(
  filePath: string,
  config: BackupConfig,
  type: string
): Promise<{ success: boolean; encrypted: boolean; originalPath?: string; newPath?: string; error?: string }> {
  const encryptionConfig = config.encryption;
  
  if (!encryptionConfig?.enabled || !encryptionConfig.password) {
    return { success: true, encrypted: false };
  }

  try {
    const encryptedFilePath = filePath + ".enc";
    const result = await encryptFile(filePath, encryptedFilePath, encryptionConfig.password);
    
    if (result.success) {
      // Eliminar el archivo original sin cifrar
      fs.unlinkSync(filePath);
      
      return {
        success: true,
        encrypted: true,
        originalPath: filePath,
        newPath: encryptedFilePath,
      };
    } else {
      return {
        success: false,
        encrypted: false,
        error: result.error || "Error al cifrar el backup",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      encrypted: false,
      error: error.message || "Error desconocido al cifrar",
    };
  }
}

// Función para subir backup al servidor SFTP si está configurado
async function uploadBackupToSftp(
  filePath: string,
  config: BackupConfig
): Promise<{ success: boolean; uploadedPath?: string; uploadedSize?: number; error?: string }> {
  const storageConfig = config.storage_ftp;
  
  if (!storageConfig?.enabled) {
    return { success: true }; // No está habilitado, continuar sin error
  }

  // Verificar que tenemos la configuración mínima
  if (!storageConfig.host || !storageConfig.username || !storageConfig.remotePath) {
    return {
      success: false,
      error: "Configuración SFTP incompleta. Se requiere host, usuario y ruta remota.",
    };
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: "El archivo de backup no existe para subir",
    };
  }

  const sftpConfig: SftpConfig = {
    host: storageConfig.host,
    port: storageConfig.port || 22,
    username: storageConfig.username,
    password: storageConfig.password || undefined,
    remotePath: storageConfig.remotePath,
  };

  console.log(`Subiendo backup a SFTP: ${storageConfig.host}:${storageConfig.port || 22}`);

  const result = await uploadFileToSftp(filePath, sftpConfig);

  if (result.success) {
    console.log(`Backup subido exitosamente a: ${result.uploadedPath}`);
    return {
      success: true,
      uploadedPath: result.uploadedPath,
      uploadedSize: result.uploadedSize,
    };
  } else {
    console.error(`Error al subir backup a SFTP: ${result.error}`);
    return {
      success: false,
      error: result.error || "Error desconocido al subir archivo",
    };
  }
}

// Función para crear backup de base de datos en Windows
async function createDatabaseBackupWindows(
  type: "database" | "files" | "full",
  userId: number,
  dbConfig: DatabaseConfig,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; encrypted?: boolean; error?: string }> {
  const startTime = Date.now();
  const fileName = `backup_${type}_${timestamp}.sql`;
  const filePath = path.join(fullBackupDir, fileName);

  // Escapar caracteres especiales en la contraseña
  const escapedPassword = dbConfig.password.replace(/"/g, '\\"');
  
  // En Windows, usar mysqldump directamente
  const mysqldumpCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p"${escapedPassword}"` : ""} "${dbConfig.database}"`;

  try {
    const { stdout, stderr } = await execAsync(mysqldumpCmd);

    if (stderr && !stderr.includes("Warning")) {
      console.error("mysqldump stderr:", stderr);
    }

    fs.writeFileSync(filePath, stdout);

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const checksum = crypto
      .createHash("sha256")
      .update(stdout)
      .digest("hex");

    // Cifrar el archivo si está configurado
    let finalPath = filePath;
    let isEncrypted = false;
    if (config.encryption?.enabled && config.encryption?.password) {
      const encryptResult = await encryptBackupIfNeeded(filePath, config, type);
      if (!encryptResult.success) {
        throw new Error(encryptResult.error || "Error al cifrar el backup");
      }
      if (encryptResult.encrypted && encryptResult.newPath) {
        finalPath = encryptResult.newPath;
        isEncrypted = true;
      }
    }

    const finalStats = fs.statSync(finalPath);

    // Registrar en la base de datos
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, 0, ?, ?, NOW())
      `,
      values: [type, finalPath, finalStats.size, duration, checksum, isEncrypted ? 1 : 0, userId],
    });

    return {
      success: true,
      filePath: finalPath,
      size: finalStats.size,
      encrypted: isEncrypted,
    };
  } catch (error: any) {
    const errorMessage = error.message || "Error desconocido";

    if (
      errorMessage.includes("not recognized") ||
      errorMessage.includes("not found")
    ) {
      throw new Error(
        "mysqldump no está instalado. Instale MySQL Client para crear backups de base de datos."
      );
    }
    if (errorMessage.includes("Access denied")) {
      throw new Error(
        "Acceso denegado a la base de datos. Verifique las credenciales."
      );
    }
    if (errorMessage.includes("Unknown database")) {
      throw new Error("La base de datos especificada no existe.");
    }

    throw new Error(`Error en mysqldump: ${errorMessage}`);
  }
}

// Función para crear backup de archivos en Windows
async function createFilesBackupWindows(
  userId: number,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; encrypted?: boolean; error?: string }> {
  const startTime = Date.now();
  const fileName = `backup_app_${timestamp}.zip`;
  const appRootDir = process.cwd();

  try {
    if (!fs.existsSync(appRootDir)) {
      throw new Error("El directorio de la aplicación no existe");
    }

    const aplicacionDir = path.join(fullBackupDir, "Aplicacion");
    fs.mkdirSync(aplicacionDir, { recursive: true });

    const filePath = path.join(aplicacionDir, fileName);

    const tempBackupDir = path.join(aplicacionDir, `backup_app_${timestamp}`);
    fs.mkdirSync(tempBackupDir, { recursive: true });

    copyDirectoryExcluding(appRootDir, tempBackupDir, [".git", "backups", "node_modules"]);

    const psZipCommand = `powershell -Command "Compress-Archive -Path '${tempBackupDir}\\*' -DestinationPath '${filePath}' -Force"`;
    await execAsync(psZipCommand);

    fs.rmSync(tempBackupDir, { recursive: true, force: true });

    if (!fs.existsSync(filePath)) {
      throw new Error("El archivo de backup no fue creado");
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Cifrar el archivo si está configurado
    let finalPath = filePath;
    let isEncrypted = false;
    if (config.encryption?.enabled && config.encryption?.password) {
      const encryptResult = await encryptBackupIfNeeded(filePath, config, "files");
      if (!encryptResult.success) {
        throw new Error(encryptResult.error || "Error al cifrar el backup");
      }
      if (encryptResult.encrypted && encryptResult.newPath) {
        finalPath = encryptResult.newPath;
        isEncrypted = true;
      }
    }

    const finalStats = fs.statSync(finalPath);
    const finalChecksum = crypto.createHash("sha256").update(fs.readFileSync(finalPath)).digest("hex");

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES ('files', 'success', ?, ?, ?, ?, 1, ?, ?, NOW())
      `,
      values: [finalPath, finalStats.size, duration, finalChecksum, isEncrypted ? 1 : 0, userId],
    });

    return {
      success: true,
      filePath: finalPath,
      size: finalStats.size,
      encrypted: isEncrypted,
    };
  } catch (error: any) {
    const errorMessage = error.message || "Error desconocido";

    if (errorMessage.includes("ENOENT") || errorMessage.includes("not found")) {
      throw new Error("Uno o más directorios no existen");
    }

    throw new Error(`Error al crear backup de archivos: ${errorMessage}`);
  }
}

// Función auxiliar para copiar directorios excluyendo carpetas específicas
function copyDirectoryExcluding(
  src: string,
  dest: string,
  excludeFolders: string[]
): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (excludeFolders.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryExcluding(srcPath, destPath, excludeFolders);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Función para crear backup de base de datos en Linux
async function createDatabaseBackupLinux(
  type: "database" | "files" | "full",
  userId: number,
  dbConfig: DatabaseConfig,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; encrypted?: boolean; error?: string }> {
  const startTime = Date.now();
  const compression = config.database_backup?.compression || "gzip";
  const extension =
    compression === "gzip" ? "sql.gz" : compression === "bzip2" ? "sql.bz2" : "sql";
  const fileName = `backup_${type}_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  let mysqldumpOptions = "";

  if (config.database_backup?.singleTransaction) {
    mysqldumpOptions += " --single-transaction";
  }
  if (config.database_backup?.addDropStatements) {
    mysqldumpOptions += " --add-drop-table";
  }
  if (config.database_backup?.includeStoredProcedures) {
    mysqldumpOptions += " --routines";
  }
  if (config.database_backup?.includeTriggers) {
    mysqldumpOptions += " --triggers";
  }

  const escapedPassword = dbConfig.password.replace(/'/g, "'\\''");
  const mysqldumpCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p'${escapedPassword}'` : ""} ${mysqldumpOptions} "${dbConfig.database}"`;

  let compressCmd = "";
  if (compression === "gzip") {
    compressCmd = "gzip -9";
  } else if (compression === "bzip2") {
    compressCmd = "bzip2 -9";
  }

  const fullCommand = compressCmd
    ? `${mysqldumpCmd} | ${compressCmd} > "${filePath}"`
    : `${mysqldumpCmd} > "${filePath}"`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error("El archivo de backup no fue creado");
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Cifrar el archivo si está configurado
    let finalPath = filePath;
    let isEncrypted = false;
    let finalChecksum = checksum;
    if (config.encryption?.enabled && config.encryption?.password) {
      const encryptResult = await encryptBackupIfNeeded(filePath, config, type);
      if (!encryptResult.success) {
        throw new Error(encryptResult.error || "Error al cifrar el backup");
      }
      if (encryptResult.encrypted && encryptResult.newPath) {
        finalPath = encryptResult.newPath;
        isEncrypted = true;
        finalChecksum = crypto.createHash("sha256").update(fs.readFileSync(finalPath)).digest("hex");
      }
    }

    const finalStats = fs.statSync(finalPath);

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: [
        type,
        finalPath,
        finalStats.size,
        duration,
        finalChecksum,
        compression !== "none" ? 1 : 0,
        isEncrypted ? 1 : 0,
        userId,
      ],
    });

    return {
      success: true,
      filePath: finalPath,
      size: finalStats.size,
      encrypted: isEncrypted,
    };
  } catch (error: any) {
    const errorMessage = error.message || "Error desconocido";

    if (
      errorMessage.includes("command not found") ||
      errorMessage.includes("not found")
    ) {
      throw new Error("mysqldump no está disponible en el servidor.");
    }
    if (errorMessage.includes("Access denied")) {
      throw new Error("Acceso denegado a la base de datos.");
    }

    throw new Error(`Error en mysqldump: ${errorMessage}`);
  }
}

// Función para crear backup de archivos en Linux
async function createFilesBackupLinux(
  userId: number,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; encrypted?: boolean; error?: string }> {
  const startTime = Date.now();
  const compression = config.files_backup?.compression || "gzip";
  const extension =
    compression === "gzip" ? "tar.gz" : compression === "bzip2" ? "tar.bz2" : "tar";
  const fileName = `backup_app_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  const appRootDir = process.cwd();

  // Exclusion patterns - MUST be before the files/directories in tar command
  // Solo excluimos node_modules, .git y .next (se regeneran automáticamente)
  const excludePatterns = [
    "node_modules",
    ".git",
    ".next"
  ];
  
  const excludeFlags = excludePatterns.map(p => `--exclude=${p}`).join(" ");

  let compressCmd = "";

  if (compression === "gzip") {
    compressCmd = "gzip -9";
  } else if (compression === "bzip2") {
    compressCmd = "bzip2 -9";
  }

  // IMPORTANT: Exclude flags MUST come BEFORE the files to backup
  const tarCmd = `tar -cf - -C "${appRootDir}" ${excludeFlags} .`;
  const fullCommand = compressCmd
    ? `${tarCmd} | ${compressCmd} > "${filePath}"`
    : `${tarCmd} > "${filePath}"`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error("El archivo de backup no fue creado");
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Cifrar el archivo si está configurado
    let finalPath = filePath;
    let isEncrypted = false;
    let finalChecksum = checksum;
    if (config.encryption?.enabled && config.encryption?.password) {
      const encryptResult = await encryptBackupIfNeeded(filePath, config, "files");
      if (!encryptResult.success) {
        throw new Error(encryptResult.error || "Error al cifrar el backup");
      }
      if (encryptResult.encrypted && encryptResult.newPath) {
        finalPath = encryptResult.newPath;
        isEncrypted = true;
        finalChecksum = crypto.createHash("sha256").update(fs.readFileSync(finalPath)).digest("hex");
      }
    }

    const finalStats = fs.statSync(finalPath);

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, encrypted, created_by, completed_at)
        VALUES ('files', 'success', ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: [
        finalPath,
        finalStats.size,
        duration,
        finalChecksum,
        compression !== "none" ? 1 : 0,
        isEncrypted ? 1 : 0,
        userId,
      ],
    });

    return {
      success: true,
      filePath: finalPath,
      size: finalStats.size,
      encrypted: isEncrypted,
    };
  } catch (error: any) {
    const errorMessage = error.message || "Error desconocido";

    if (
      errorMessage.includes("command not found") ||
      errorMessage.includes("not found")
    ) {
      throw new Error("tar no está disponible en el servidor.");
    }

    throw new Error(`Error en tar: ${errorMessage}`);
  }
}

// Función principal para crear backup de base de datos
async function createDatabaseBackup(
  type: "database" | "files" | "full",
  userId: number
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const config = await getBackupConfig();
  const dbConfig = getDatabaseConnection();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = config.storage_local?.path || "backups";

  let fullBackupDir: string;
  if (backupDir.startsWith("/")) {
    fullBackupDir = backupDir;
  } else {
    fullBackupDir = path.join(process.cwd(), backupDir);
  }

  const baseDatosDir = path.join(fullBackupDir, "Base_datos");

  try {
    fs.mkdirSync(fullBackupDir, { recursive: true });
    fs.mkdirSync(baseDatosDir, { recursive: true });
  } catch (error) {
    throw new Error(
      `No se pudo crear el directorio de backups: ${fullBackupDir}`
    );
  }

  if (isWindows) {
    return createDatabaseBackupWindows(type, userId, dbConfig, baseDatosDir, timestamp, config);
  } else {
    return createDatabaseBackupLinux(
      type,
      userId,
      dbConfig,
      baseDatosDir,
      timestamp,
      config
    );
  }
}

// Función principal para crear backup de archivos
async function createFilesBackup(
  userId: number
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const config = await getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = config.storage_local?.path || "backups";

  let fullBackupDir: string;
  if (backupDir.startsWith("/")) {
    fullBackupDir = backupDir;
  } else {
    fullBackupDir = path.join(process.cwd(), backupDir);
  }

  const aplicacionDir = path.join(fullBackupDir, "Aplicacion");

  try {
    fs.mkdirSync(fullBackupDir, { recursive: true });
    fs.mkdirSync(aplicacionDir, { recursive: true });
  } catch (error) {
    throw new Error(
      `No se pudo crear el directorio de backups: ${fullBackupDir}`
    );
  }

  if (isWindows) {
    return createFilesBackupWindows(userId, fullBackupDir, timestamp, config);
  } else {
    return createFilesBackupLinux(userId, fullBackupDir, timestamp, config);
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // POST: Crear backup
  if (req.method === "POST") {
    try {
      const { type } = req.body;

      if (!type || !["database", "files", "full"].includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Tipo de backup inválido. Use: database, files, o full",
        });
      }

      const userId = req.user?.userId || 0;

      // Obtener configuración de backup
      const config = await getBackupConfig();

      // Crear log inicial
      let initialLogId: number;
      try {
        const result = (await executeQuery({
          query: `
            INSERT INTO backup_logs (backup_type, status, created_by)
            VALUES (?, 'in_progress', ?)
          `,
          values: [type, userId],
        })) as any;
        initialLogId = result.insertId;
      } catch (insertError: any) {
        console.error("Error al crear registro inicial:", insertError);
        if (
          insertError.message?.includes("not exist") ||
          insertError.code === "ER_NO_SUCH_TABLE"
        ) {
          return res.status(500).json({
            success: false,
            message:
              "La tabla de logs de backup no existe. Ejecuta el script SQL de creación de tablas.",
            error: "Tabla no encontrada",
            code: "TABLE_NOT_EXISTS",
          });
        }
        throw insertError;
      }

      let backupResult;

      try {
        if (type === "database") {
          backupResult = await createDatabaseBackup(type, userId);
        } else if (type === "files") {
          backupResult = await createFilesBackup(userId);
        } else {
          // Full backup: primero base de datos, luego archivos
          const dbResult = await createDatabaseBackup("database", userId);
          const filesResult = await createFilesBackup(userId);

          backupResult = {
            success: dbResult.success && filesResult.success,
            error: !dbResult.success
              ? dbResult.error
              : !filesResult.success
              ? filesResult.error
              : undefined,
            filePath: dbResult.filePath,
            size: (dbResult.size || 0) + (filesResult.size || 0),
          };
        }
      } catch (backupError: any) {
        // Actualizar el registro a fallido
        try {
          await executeQuery({
            query: `
              UPDATE backup_logs 
              SET status = 'failed', error_message = ?, completed_at = NOW()
              WHERE id = ?
            `,
            values: [backupError.message, initialLogId],
          });
        } catch (updateError) {
          console.error("Error al actualizar estado:", updateError);
        }

        // Enviar notificación de error
        try {
          const result: BackupResult = {
            type,
            status: "failed",
            error: backupError.message,
          };
          await sendBackupNotification(result);
        } catch (notificationError) {
          console.error("Error al enviar notificación:", notificationError);
        }

        return res.status(500).json({
          success: false,
          message: "Error al crear backup",
          error: backupError.message,
        });
      }

      if (backupResult.success) {
        // Subir backup a SFTP si está configurado
        let sftpUploaded = false;
        let sftpPath = "";
        
        if (backupResult.filePath && fs.existsSync(backupResult.filePath)) {
          try {
            const sftpResult = await uploadBackupToSftp(backupResult.filePath, config);
            if (sftpResult.success) {
              sftpUploaded = true;
              sftpPath = sftpResult.uploadedPath || "";
              
              // Registrar en log
              await executeQuery({
                query: `
                  INSERT INTO backup_logs 
                  (backup_type, status, file_path, file_size, error_message, created_by, completed_at)
                  VALUES ('sftp_upload', 'success', ?, ?, 'Subido a SFTP', ?, NOW())
                `,
                values: [sftpPath, sftpResult.uploadedSize || 0, userId],
              });
            } else {
              console.error(`Error SFTP: ${sftpResult.error}`);
            }
          } catch (sftpError: any) {
            console.error("Error al subir a SFTP:", sftpError);
          }
        }

        // Enviar notificación de éxito
        try {
          const result: BackupResult = {
            type,
            status: "success",
            filePath: backupResult.filePath,
            size: backupResult.size,
          };
          await sendBackupNotification(result);
        } catch (notificationError) {
          console.error("Error al enviar notificación:", notificationError);
        }

        return res.status(200).json({
          success: true,
          message: `Backup de ${type} creado exitosamente${sftpUploaded ? " y subido a SFTP" : ""}`,
          filePath: backupResult.filePath,
          size: backupResult.size,
          sftpUploaded,
          sftpPath: sftpUploaded ? sftpPath : undefined,
        });
      } else {
        // Actualizar el registro a fallido
        try {
          await executeQuery({
            query: `
              UPDATE backup_logs 
              SET status = 'failed', error_message = ?, completed_at = NOW()
              WHERE id = ?
            `,
            values: [backupResult.error || "Error desconocido", initialLogId],
          });
        } catch (updateError) {
          console.error("Error al actualizar estado:", updateError);
        }

        // Enviar notificación de error
        try {
          const result: BackupResult = {
            type,
            status: "failed",
            error: backupResult.error || "Error desconocido",
          };
          await sendBackupNotification(result);
        } catch (notificationError) {
          console.error("Error al enviar notificación:", notificationError);
        }

        return res.status(500).json({
          success: false,
          message: "Error al crear backup",
          error: backupResult.error,
        });
      }
    } catch (error: any) {
      console.error("Error al crear backup:", error);

      if (
        error.message?.includes("not exist") ||
        error.code === "ER_NO_SUCH_TABLE"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "La tabla de logs de backup no existe. Ejecuta el script SQL de creación de tablas.",
          error: "Tabla no encontrada",
          code: "TABLE_NOT_EXISTS",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
