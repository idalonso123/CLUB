import { useState, useEffect, useCallback } from 'react';

interface BackupConfig {
  system_enabled: boolean;
  database_backup: {
    enabled: boolean;
    schedule: string;
    time: string;
    dayOfWeek: number;
    dayOfMonth: number;
    retention: number;
    compression: string;
    includeStoredProcedures: boolean;
    includeTriggers: boolean;
    includeEvents: boolean;
    singleTransaction: boolean;
    addDropStatements: boolean;
  };
  files_backup: {
    enabled: boolean;
    schedule: string;
    time: string;
    dayOfWeek: number;
    dayOfMonth: number;
    retention: number;
    compression: string;
    includeUploads: boolean;
    includeConfig: boolean;
    includeLogs: boolean;
    excludePatterns: string[];
  };
  storage: {
    local: { enabled: boolean; path: string; maxSize: number };
    ftp: { enabled: boolean; host: string; port: number; username: string; password: string; remotePath: string; passiveMode: boolean };
    s3: { enabled: boolean; accessKey: string; secretKey: string; bucket: string; region: string; endpoint: string };
    googleDrive: { enabled: boolean; credentials: string; folderId: string };
  };
  encryption: { enabled: boolean; password: string };
  notifications: {
    enabled: boolean;
    emailOnSuccess: boolean;
    emailOnFailure: boolean;
    emailRecipients: string[];
    webhookUrl: string;
    webhookEvents: string[];
  };
  maintenance: {
    autoCleanup: boolean;
    cleanupRetention: number;
    verifyIntegrity: boolean;
    testRestoration: boolean;
  };
}

interface BackupLog {
  id: number;
  type: string;
  status: string;
  filePath?: string;
  size: number;
  sizeFormatted: string;
  duration: string;
  errorMessage?: string;
  checksum?: string;
  compressed: boolean;
  encrypted: boolean;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

interface BackupStats {
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
  totalSize: string;
  totalSizeFormatted: string;
}

interface StorageStats {
  used: { formatted: string; megabytes: number };
  available: { formatted: string; megabytes: number };
  max: { formatted: string; megabytes: number };
  usagePercentage: number;
}

interface ScheduledBackup {
  id: number;
  name: string;
  backup_type: "database" | "files" | "full";
  schedule_type: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

export function useBackup() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [scheduledBackups, setScheduledBackups] = useState<ScheduledBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/backup/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setError((err as Error).message);
    }
  }, []);

  // Cargar historial de backups
  const loadLogs = useCallback(async (page = 1, limit = 20, type?: string, status?: string) => {
    try {
      let url = `/api/admin/backup/logs?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setError((err as Error).message);
    }
  }, []);

  // Cargar estadísticas de almacenamiento
  const loadStorageStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/backup/cleanup');
      const data = await response.json();
      
      if (data.success) {
        setStorage(data.storage);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError((err as Error).message);
    }
  }, []);

  // Guardar configuración
  const saveConfig = useCallback(async (newConfig: Partial<BackupConfig>) => {
    try {
      const response = await fetch('/api/admin/backup/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfig();
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadConfig]);

  // Crear backup
  const createBackup = useCallback(async (type: 'database' | 'files' | 'full') => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLogs();
        await loadStorageStats();
        return { success: true, ...data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al crear backup:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadLogs, loadStorageStats]);

  // Restaurar backup
  const restoreBackup = useCallback(async (backupId: number, createBackupBefore = true) => {
    try {
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId, createBackupBefore }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLogs();
        return { success: true, ...data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al restaurar backup:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadLogs]);

  // Eliminar backup
  const deleteBackup = useCallback(async (backupId: number) => {
    try {
      const response = await fetch('/api/admin/backup/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: backupId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLogs();
        await loadStorageStats();
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al eliminar backup:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadLogs, loadStorageStats]);

  // Ejecutar limpieza
  const runCleanup = useCallback(async (dryRun = false) => {
    try {
      const response = await fetch('/api/admin/backup/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadLogs();
        await loadStorageStats();
        return { success: true, ...data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al ejecutar limpieza:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadLogs, loadStorageStats]);

  // Descargar backup
  const downloadBackup = useCallback(async (backupId: number) => {
    try {
      const log = logs.find(l => l.id === backupId);
      if (!log || !log.filePath) {
        throw new Error('Archivo de backup no encontrado');
      }
      
      // Abrir en nueva ventana para descargar
      window.open(`/api/admin/backup/download?id=${backupId}`, '_blank');
      
      return { success: true };
    } catch (err) {
      console.error('Error al descargar backup:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [logs]);

  // Probar conexión SFTP
  const testSftpConnection = useCallback(async (sftpConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    remotePath: string;
  }) => {
    try {
      const response = await fetch('/api/admin/backup/sftp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sftpConfig),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || data.message };
      }
    } catch (err) {
      console.error('Error al probar conexión SFTP:', err);
      return { success: false, error: (err as Error).message };
    }
  }, []);

  // Verificar integridad de un backup
  const verifyIntegrity = useCallback(async (backupId: number) => {
    try {
      const response = await fetch(`/api/admin/backup/verify-integrity?id=${backupId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          isValid: data.isValid,
          message: data.message,
          checksumStored: data.checksumStored,
          checksumCurrent: data.checksumCurrent,
          algorithm: data.algorithm,
          verifiedAt: data.verifiedAt,
        };
      } else {
        return {
          success: false,
          error: data.error || data.message,
        };
      }
    } catch (err) {
      console.error('Error al verificar integridad:', err);
      return { success: false, error: (err as Error).message };
    }
  }, []);

  // Cargar backups programados
  const loadScheduledBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/backup/scheduled');
      const data = await response.json();
      
      if (data.success) {
        setScheduledBackups(data.data);
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al cargar backups programados:', err);
      return { success: false, error: (err as Error).message };
    }
  }, []);

  // Crear backup programado
  const createScheduledBackup = useCallback(async (schedule: {
    name: string;
    backup_type: "database" | "files" | "full";
    schedule_type: "hourly" | "daily" | "weekly" | "monthly";
    time: string;
    day_of_week?: number;
    day_of_month?: number;
    enabled?: boolean;
  }) => {
    try {
      const response = await fetch('/api/admin/backup/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadScheduledBackups();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al crear backup programado:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadScheduledBackups]);

  // Actualizar backup programado
  const updateScheduledBackup = useCallback(async (schedule: {
    id: number;
    name?: string;
    backup_type?: "database" | "files" | "full";
    schedule_type?: "hourly" | "daily" | "weekly" | "monthly";
    time?: string;
    day_of_week?: number;
    day_of_month?: number;
    enabled?: boolean;
  }) => {
    try {
      const response = await fetch('/api/admin/backup/scheduled', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadScheduledBackups();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al actualizar backup programado:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadScheduledBackups]);

  // Eliminar backup programado
  const deleteScheduledBackup = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/admin/backup/scheduled?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadScheduledBackups();
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error al eliminar backup programado:', err);
      return { success: false, error: (err as Error).message };
    }
  }, [loadScheduledBackups]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadConfig(), loadLogs(), loadStorageStats(), loadScheduledBackups()]);
      setLoading(false);
    };
    
    loadAll();
  }, [loadConfig, loadLogs, loadStorageStats, loadScheduledBackups]);

  return {
    config,
    logs,
    stats,
    storage,
    scheduledBackups,
    loading,
    error,
    loadConfig,
    loadLogs,
    loadStorageStats,
    saveConfig,
    createBackup,
    restoreBackup,
    deleteBackup,
    runCleanup,
    downloadBackup,
    testSftpConnection,
    verifyIntegrity,
    loadScheduledBackups,
    createScheduledBackup,
    updateScheduledBackup,
    deleteScheduledBackup,
  };
}
