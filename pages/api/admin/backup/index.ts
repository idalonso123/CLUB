import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

const execAsync = promisify(exec);

// Detectar si estamos en Windows
const isWindows = os.platform() === 'win32';

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
}

async function getBackupConfig(): Promise<BackupConfig> {
  const rows = await executeQuery({
    query: "SELECT config_key, config_value FROM backup_config",
    values: [],
  }) as any[];

  const config: BackupConfig = {};
  
  for (const row of rows) {
    try {
      config[row.config_key as keyof BackupConfig] = JSON.parse(row.config_value);
    } catch {
      config[row.config_key as keyof BackupConfig] = row.config_value;
    }
  }
  
  return config;
}

function getDatabaseConnection(): { host: string; port: number; user: string; password: string; database: string } {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  };
}

// Función para crear backup de base de datos en Windows (usando mysql client)
async function createDatabaseBackupWindows(
  type: 'database' | 'files' | 'full',
  userId: number,
  dbConfig: { host: string; port: number; user: string; password: string; database: string },
  fullBackupDir: string,
  timestamp: string
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const fileName = `backup_${type}_${timestamp}.sql`;
  const filePath = path.join(fullBackupDir, fileName);

  // En Windows, usar mysqldump directamente sin tubería
  const mysqldumpCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p"${dbConfig.password}"` : ''} "${dbConfig.database}"`;

  try {
    // Ejecutar mysqldump y guardar directamente
    const { stdout, stderr } = await execAsync(mysqldumpCmd);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error('mysqldump stderr:', stderr);
    }

    // Escribir el resultado al archivo
    fs.writeFileSync(filePath, stdout);

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const checksum = crypto.createHash('sha256').update(stdout).digest('hex');

    // Registrar en la base de datos
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, 0, ?, NOW())
      `,
      values: [type, filePath, stats.size, duration, checksum, userId],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido';
    
    // Verificar errores específicos
    if (errorMessage.includes('not recognized') || errorMessage.includes('not found')) {
      throw new Error('mysqldump no está instalado. Instale MySQL Client para crear backups de base de datos.');
    }
    if (errorMessage.includes('Access denied')) {
      throw new Error('Acceso denegado a la base de datos. Verifique las credenciales.');
    }
    if (errorMessage.includes('Unknown database')) {
      throw new Error('La base de datos especificada no existe.');
    }
    
    throw new Error(`Error en mysqldump: ${errorMessage}`);
  }
}

// Función para crear backup de archivos en Windows
async function createFilesBackupWindows(
  type: 'database' | 'files' | 'full',
  userId: number,
  fullBackupDir: string,
  timestamp: string
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const fileName = `backup_app_${timestamp}.zip`;

  // En Windows, crear un ZIP usando PowerShell
  const appRootDir = process.cwd();

  try {
    // Verificar que el directorio de la aplicación existe
    if (!fs.existsSync(appRootDir)) {
      throw new Error('El directorio de la aplicación no existe');
    }

    // Crear subcarpeta Aplicacion si no existe
    const aplicacionDir = path.join(fullBackupDir, 'Aplicacion');
    fs.mkdirSync(aplicacionDir, { recursive: true });

    // Ruta completa del archivo ZIP dentro de Aplicacion
    const filePath = path.join(aplicacionDir, fileName);

    // Crear directorio temporal para el backup
    const tempBackupDir = path.join(aplicacionDir, `backup_app_${timestamp}`);
    fs.mkdirSync(tempBackupDir, { recursive: true });

    // Copiar toda la aplicación excepto .git y backups (incluir node_modules para restauración completa)
    copyDirectoryExcluding(appRootDir, tempBackupDir, ['.git', 'backups']);

    // En Windows, usar PowerShell para crear el ZIP
    const psZipCommand = `powershell -Command "Compress-Archive -Path '${tempBackupDir}\*' -DestinationPath '${filePath}' -Force"`;
    await execAsync(psZipCommand);

    // Eliminar el directorio temporal después de comprimir
    fs.rmSync(tempBackupDir, { recursive: true, force: true });

    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo de backup no fue creado');
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Registrar en la base de datos
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, 1, ?, NOW())
      `,
      values: ['files', filePath, stats.size, duration, checksum, userId],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido';
    
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      throw new Error('Uno o más directorios no existen');
    }
    
    throw new Error(`Error al crear backup de archivos: ${errorMessage}`);
  }
}

// Función auxiliar para copiar directorios recursivamente
function copyDirectory(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Excluir carpetas no deseadas
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        copyDirectory(srcPath, destPath);
      }
    } else {
      // Copiar archivos
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Función auxiliar para copiar directorios excluyendo carpetas específicas
function copyDirectoryExcluding(src: string, dest: string, excludeFolders: string[]): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Verificar si esta carpeta debe ser excluida
    if (excludeFolders.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryExcluding(srcPath, destPath, excludeFolders);
    } else {
      // Copiar archivos
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Función para crear backup de base de datos en Linux
async function createDatabaseBackupLinux(
  type: 'database' | 'files' | 'full',
  userId: number,
  dbConfig: { host: string; port: number; user: string; password: string; database: string },
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const compression = config.database_backup?.compression || 'gzip';
  const extension = compression === 'gzip' ? 'sql.gz' : compression === 'bzip2' ? 'sql.bz2' : 'sql';
  const fileName = `backup_${type}_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  let mysqldumpOptions = '';
  
  if (config.database_backup?.singleTransaction) {
    mysqldumpOptions += ' --single-transaction';
  }
  if (config.database_backup?.addDropStatements) {
    mysqldumpOptions += ' --add-drop-table';
  }
  if (config.database_backup?.includeStoredProcedures) {
    mysqldumpOptions += ' --routines';
  }
  if (config.database_backup?.includeTriggers) {
    mysqldumpOptions += ' --triggers';
  }

  // Escapar caracteres especiales en la contraseña
  const escapedPassword = dbConfig.password.replace(/'/g, "'\\''");
  const mysqldumpCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p'${escapedPassword}'` : ''} ${mysqldumpOptions} "${dbConfig.database}"`;

  let compressCmd = '';
  if (compression === 'gzip') {
    compressCmd = 'gzip -9';
  } else if (compression === 'bzip2') {
    compressCmd = 'bzip2 -9';
  }

  const fullCommand = compressCmd ? `${mysqldumpCmd} | ${compressCmd} > ${filePath}` : `${mysqldumpCmd} > ${filePath}`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo de backup no fue creado');
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: [type, filePath, stats.size, duration, checksum, compression !== 'none' ? 1 : 0, userId],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido';
    
    if (errorMessage.includes('command not found') || errorMessage.includes('not found')) {
      throw new Error('mysqldump no está disponible en el servidor.');
    }
    if (errorMessage.includes('Access denied')) {
      throw new Error('Acceso denegado a la base de datos.');
    }
    
    throw new Error(`Error en mysqldump: ${errorMessage}`);
  }
}

// Función para crear backup de archivos en Linux
async function createFilesBackupLinux(
  type: 'database' | 'files' | 'full',
  userId: number,
  fullBackupDir: string,
  timestamp: string,
  config: BackupConfig
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const compression = config.files_backup?.compression || 'gzip';
  const extension = compression === 'gzip' ? 'tar.gz' : compression === 'bzip2' ? 'tar.bz2' : 'tar';
  const fileName = `backup_app_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  // Ruta completa de la aplicación
  const appRootDir = process.cwd();

  // Excluir solo .git y backups (incluir node_modules para restauración completa)
  const excludeFlags = ['--exclude=.git', '--exclude=backups'];
  const excludeStr = excludeFlags.join(' ');
  
  let compressCmd = '';
  
  if (compression === 'gzip') {
    compressCmd = 'gzip -9';
  } else if (compression === 'bzip2') {
    compressCmd = 'bzip2 -9';
  }

  // Backup de toda la aplicación
  const tarCmd = `tar -cf - -C "${appRootDir}" . ${excludeStr}`;
  const fullCommand = compressCmd ? `${tarCmd} | ${compressCmd} > "${filePath}"` : `${tarCmd} > "${filePath}"`;

  try {
    await execAsync(fullCommand);

    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo de backup no fue creado');
    }

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: ['files', filePath, stats.size, duration, checksum, compression !== 'none' ? 1 : 0, userId],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido';
    
    if (errorMessage.includes('command not found') || errorMessage.includes('not found')) {
      throw new Error('tar no está disponible en el servidor.');
    }
    
    throw new Error(`Error en tar: ${errorMessage}`);
  }
}

// Función principal para crear backup de base de datos
async function createDatabaseBackup(
  type: 'database' | 'files' | 'full',
  userId: number
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const config = await getBackupConfig();
  const dbConfig = getDatabaseConnection();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage_local?.path || 'backups';
  
  let fullBackupDir: string;
  if (backupDir.startsWith('/')) {
    fullBackupDir = backupDir;
  } else {
    fullBackupDir = path.join(process.cwd(), backupDir);
  }
  
  // Crear subcarpeta Base_datos para backups de base de datos
  const baseDatosDir = path.join(fullBackupDir, 'Base_datos');
  
  try {
    // Crear directorio base de backups
    fs.mkdirSync(fullBackupDir, { recursive: true });
    fs.mkdirSync(baseDatosDir, { recursive: true });
  } catch (error) {
    throw new Error(`No se pudo crear el directorio de backups: ${fullBackupDir}`);
  }

  if (isWindows) {
    return createDatabaseBackupWindows(type, userId, dbConfig, baseDatosDir, timestamp);
  } else {
    return createDatabaseBackupLinux(type, userId, dbConfig, baseDatosDir, timestamp, config);
  }
}

// Función principal para crear backup de archivos
async function createFilesBackup(
  type: 'database' | 'files' | 'full',
  userId: number
): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const config = await getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage_local?.path || 'backups';
  
  let fullBackupDir: string;
  if (backupDir.startsWith('/')) {
    fullBackupDir = backupDir;
  } else {
    fullBackupDir = path.join(process.cwd(), backupDir);
  }
  
  // Crear subcarpeta Aplicacion para backups de archivos
  const aplicacionDir = path.join(fullBackupDir, 'Aplicacion');
  
  try {
    // Crear directorio base de backups
    fs.mkdirSync(fullBackupDir, { recursive: true });
    fs.mkdirSync(aplicacionDir, { recursive: true });
  } catch (error) {
    throw new Error(`No se pudo crear el directorio de backups: ${fullBackupDir}`);
  }

  if (isWindows) {
    return createFilesBackupWindows(type, userId, fullBackupDir, timestamp);
  } else {
    return createFilesBackupLinux(type, userId, fullBackupDir, timestamp, config);
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
      
      if (!type || !['database', 'files', 'full'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de backup inválido. Use: database, files, o full",
        });
      }

      const userId = req.user?.userId || 0;

      // Crear log inicial
      await executeQuery({
        query: `
          INSERT INTO backup_logs (backup_type, status, created_by)
          VALUES (?, 'in_progress', ?)
        `,
        values: [type, userId],
      });

      let backupResult;
      
      if (type === 'database') {
        backupResult = await createDatabaseBackup(type, userId);
      } else if (type === 'files') {
        backupResult = await createFilesBackup(type, userId);
      } else {
        // Full backup: primero base de datos, luego archivos
        const dbResult = await createDatabaseBackup('database', userId);
        const filesResult = await createFilesBackup('files', userId);
        
        backupResult = {
          success: dbResult.success && filesResult.success,
          error: !dbResult.success ? dbResult.error : !filesResult.success ? filesResult.error : undefined,
        };
      }

      if (backupResult.success) {
        return res.status(200).json({
          success: true,
          message: `Backup de ${type} creado exitosamente`,
          filePath: backupResult.filePath,
          size: backupResult.size,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Error al crear backup",
          error: backupResult.error,
        });
      }
    } catch (error) {
      console.error("Error al crear backup:", error);
      return res.status(500).json({
        success: false,
        message: "Error al crear backup",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
