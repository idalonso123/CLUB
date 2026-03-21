/**
 * Script de Cron Job para Backups Automáticos
 * 
 * Este script debe ejecutarse periódicamente (recomendado: cada hora)
 * para verificar y ejecutar los backups programados.
 * 
 * Configuración del cron:
 * 0 * * * * /usr/bin/node /path/to/scripts/backup-cron.ts
 * 
 * O usando npm:
 * 0 * * * * cd /path/to/project && npm run backup:cron
 */

import executeQuery from '../lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface BackupSchedule {
  id: number;
  backup_type: 'database' | 'files' | 'full';
  schedule: 'hourly' | 'daily' | 'weekly' | 'monthly';
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
}

function getDatabaseConnection(): { host: string; port: number; user: string; password: string; database: string } {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'viveverde',
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

async function getScheduledBackups(): Promise<BackupSchedule[]> {
  const rows = await executeQuery({
    query: "SELECT * FROM backup_scheduled WHERE enabled = 1",
    values: [],
  }) as any[];

  return rows.map(row => ({
    id: row.id,
    backup_type: row.backup_type,
    schedule: row.schedule,
    time: row.time,
    day_of_week: row.day_of_week,
    day_of_month: row.day_of_month,
    enabled: row.enabled === 1,
    last_run: row.last_run,
    next_run: row.next_run,
  }));
}

function shouldRunBackup(schedule: BackupSchedule): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDayOfWeek = now.getDay();
  const currentDayOfMonth = now.getDate();
  
  // Verificar si es la hora correcta
  if (schedule.time !== currentTime) {
    return false;
  }
  
  // Verificar según el tipo de programación
  switch (schedule.schedule) {
    case 'hourly':
      return true;
      
    case 'daily':
      return true;
      
    case 'weekly':
      return schedule.day_of_week === currentDayOfWeek;
      
    case 'monthly':
      return schedule.day_of_month === currentDayOfMonth;
      
    default:
      return false;
  }
}

function calculateNextRun(schedule: BackupSchedule): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule.schedule) {
    case 'hourly':
      nextRun.setHours(nextRun.getHours() + 1);
      break;
      
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'weekly':
      const daysUntilNext = (7 - now.getDay() + schedule.day_of_week!) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;
      
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      if (schedule.day_of_month) {
        nextRun.setDate(Math.min(schedule.day_of_month, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
      }
      break;
  }
  
  return nextRun;
}

async function createDatabaseBackup(type: 'database' | 'files' | 'full'): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const config = await getBackupConfig();
  const dbConfig = getDatabaseConnection();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage_local?.path || '/backups';
  const compression = config.database_backup?.compression || 'gzip';
  
  const fullBackupDir = path.join(process.cwd(), '..', backupDir.replace('/', ''));
  
  try {
    fs.mkdirSync(fullBackupDir, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio de backup:', error);
  }

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

  const mysqldumpCmd = `mysqldump -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? `-p${dbConfig.password}` : ''} ${mysqldumpOptions} ${dbConfig.database}`;

  let compressCmd = '';
  if (compression === 'gzip') {
    compressCmd = `gzip -9`;
  } else if (compression === 'bzip2') {
    compressCmd = `bzip2 -9`;
  }

  try {
    const fullCommand = compressCmd ? `${mysqldumpCmd} | ${compressCmd} > ${filePath}` : `${mysqldumpCmd} > ${filePath}`;
    await execAsync(fullCommand);

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);

    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, 0, NOW())
      `,
      values: [type, filePath, stats.size, duration, checksum, compression !== 'none' ? 1 : 0],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, error_message, duration_seconds, created_by, completed_at)
        VALUES (?, 'failed', ?, ?, 0, NOW())
      `,
      values: [type, error.message, duration],
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

async function createFilesBackup(type: 'database' | 'files' | 'full'): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
  const startTime = Date.now();
  const config = await getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage_local?.path || '/backups';
  const compression = config.files_backup?.compression || 'gzip';
  
  const fullBackupDir = path.join(process.cwd(), '..', backupDir.replace('/', ''));
  
  try {
    fs.mkdirSync(fullBackupDir, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio de backup:', error);
  }

  const extension = compression === 'gzip' ? 'tar.gz' : compression === 'bzip2' ? 'tar.bz2' : 'tar';
  const fileName = `backup_files_${timestamp}.${extension}`;
  const filePath = path.join(fullBackupDir, fileName);

  const dirsToBackup = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'uploads'),
  ];

  const excludeFlags = ['--exclude=node_modules', '--exclude=.git', '--exclude=*.log'];

  try {
    const excludeStr = excludeFlags.join(' ');
    const dirsStr = dirsToBackup.join(' ');
    let compressCmd = '';
    
    if (compression === 'gzip') {
      compressCmd = 'gzip -9';
    } else if (compression === 'bzip2') {
      compressCmd = 'bzip2 -9';
    }

    const tarCmd = `tar -cf - ${dirsStr} ${excludeStr}`;
    const fullCommand = compressCmd ? `${tarCmd} | ${compressCmd} > ${filePath}` : `${tarCmd} > ${filePath}`;
    
    await execAsync(fullCommand);

    const stats = fs.statSync(filePath);
    const duration = Math.round((Date.now() - startTime) / 1000);

    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, file_path, file_size, duration_seconds, checksum, compressed, created_by, completed_at)
        VALUES (?, 'success', ?, ?, ?, ?, ?, 0, NOW())
      `,
      values: ['files', filePath, stats.size, duration, checksum, compression !== 'none' ? 1 : 0],
    });

    return {
      success: true,
      filePath,
      size: stats.size,
    };
  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await executeQuery({
      query: `
        INSERT INTO backup_logs 
        (backup_type, status, error_message, duration_seconds, created_by, completed_at)
        VALUES (?, 'failed', ?, ?, 0, NOW())
      `,
      values: ['files', error.message, duration],
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

async function runScheduledBackups() {
  console.log('[' + new Date().toISOString() + '] Iniciando verificación de backups programados...');
  
  try {
    const schedules = await getScheduledBackups();
    
    for (const schedule of schedules) {
      if (!schedule.enabled) {
        console.log(`  - ${schedule.backup_type}: Deshabilitado, omitiendo`);
        continue;
      }
      
      if (!shouldRunBackup(schedule)) {
        console.log(`  - ${schedule.backup_type}: No es momento de ejecutar`);
        continue;
      }
      
      console.log(`  - ${schedule.backup_type}: Ejecutando backup...`);
      
      let result;
      if (schedule.backup_type === 'database') {
        result = await createDatabaseBackup('database');
      } else if (schedule.backup_type === 'files') {
        result = await createFilesBackup('files');
      } else {
        // Full backup
        const dbResult = await createDatabaseBackup('database');
        const filesResult = await createFilesBackup('files');
        result = {
          success: dbResult.success && filesResult.success,
          error: !dbResult.success ? dbResult.error : !filesResult.success ? filesResult.error : undefined,
        };
      }
      
      // Actualizar último backup
      const nextRun = calculateNextRun(schedule);
      await executeQuery({
        query: `
          UPDATE backup_scheduled 
          SET last_run = NOW(), next_run = ?
          WHERE id = ?
        `,
        values: [nextRun.toISOString(), schedule.id],
      });
      
      if (result.success) {
        console.log(`    ✓ Backup completado exitosamente`);
      } else {
        console.log(`    ✗ Error en backup: ${result.error}`);
      }
    }
    
    console.log('[' + new Date().toISOString() + '] Verificación de backups completada');
  } catch (error) {
    console.error('Error en la verificación de backups:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runScheduledBackups()
    .then(() => {
      console.log('Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { runScheduledBackups };
