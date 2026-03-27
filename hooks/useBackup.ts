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

export function useBackup() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadConfig(), loadLogs(), loadStorageStats()]);
      setLoading(false);
    };
    
    loadAll();
  }, [loadConfig, loadLogs, loadStorageStats]);

  return {
    config,
    logs,
    stats,
    storage,
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
  };
}
