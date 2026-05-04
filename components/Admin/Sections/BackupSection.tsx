import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBackup } from "@/hooks/useBackup";
import toast from "react-hot-toast";

interface LocalBackupConfig {
  enabled: boolean;
  encryptionEnabled: boolean;
  encryptionPassword: string;
  databaseBackup: {
    enabled: boolean;
    schedule: "hourly" | "daily" | "weekly" | "monthly";
    time: string;
    dayOfWeek: number;
    dayOfMonth: number;
    retention: number;
    compression: "none" | "gzip" | "bzip2" | "xz";
    includeStoredProcedures: boolean;
    includeTriggers: boolean;
    includeEvents: boolean;
    singleTransaction: boolean;
    addDropStatements: boolean;
  };
  filesBackup: {
    enabled: boolean;
    schedule: "hourly" | "daily" | "weekly" | "monthly";
    time: string;
    dayOfWeek: number;
    dayOfMonth: number;
    retention: number;
    compression: "none" | "gzip" | "bzip2" | "xz";
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

interface BackupLogItem {
  id: number;
  type: string;
  status: string;
  filePath?: string;
  size: number;
  sizeFormatted?: string;
  duration: string;
  errorMessage?: string;
  createdAt: string;
  createdByName?: string;
}

const BackupSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "storage" | "notifications" | "logs" | "schedule">("overview");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupLogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isTestingSftp, setIsTestingSftp] = useState(false);
  const [sftpTestResult, setSftpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState<number | null>(null);
  
  // Estados para programaciones de backup
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<number | null>(null);
  
  const {
    config,
    logs,
    stats,
    storage,
    scheduledBackups,
    loading,
    error,
    saveConfig,
    createBackup,
    restoreBackup,
    deleteBackup,
    runCleanup,
    loadLogs,
    testSftpConnection,
    verifyIntegrity,
    loadScheduledBackups,
    createScheduledBackup,
    updateScheduledBackup,
    deleteScheduledBackup,
  } = useBackup();

  const [localConfig, setLocalConfig] = useState<LocalBackupConfig | null>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig({
        enabled: config.system_enabled ?? true,
        encryptionEnabled: config.encryption?.enabled ?? false,
        encryptionPassword: config.encryption?.password ?? "",
        databaseBackup: {
          enabled: config.database_backup?.enabled ?? true,
          schedule: (config.database_backup?.schedule ?? "daily") as "hourly" | "daily" | "weekly" | "monthly",
          time: config.database_backup?.time ?? "02:00",
          dayOfWeek: config.database_backup?.dayOfWeek ?? 1,
          dayOfMonth: config.database_backup?.dayOfMonth ?? 1,
          retention: config.database_backup?.retention ?? 30,
          compression: (config.database_backup?.compression ?? "gzip") as "none" | "gzip" | "bzip2" | "xz",
          includeStoredProcedures: config.database_backup?.includeStoredProcedures ?? true,
          includeTriggers: config.database_backup?.includeTriggers ?? true,
          includeEvents: config.database_backup?.includeEvents ?? false,
          singleTransaction: config.database_backup?.singleTransaction ?? true,
          addDropStatements: config.database_backup?.addDropStatements ?? true,
        },
        filesBackup: {
          enabled: config.files_backup?.enabled ?? true,
          schedule: (config.files_backup?.schedule ?? "weekly") as "hourly" | "daily" | "weekly" | "monthly",
          time: config.files_backup?.time ?? "03:00",
          dayOfWeek: config.files_backup?.dayOfWeek ?? 0,
          dayOfMonth: config.files_backup?.dayOfMonth ?? 1,
          retention: config.files_backup?.retention ?? 14,
          compression: (config.files_backup?.compression ?? "gzip") as "none" | "gzip" | "bzip2" | "xz",
          includeUploads: config.files_backup?.includeUploads ?? true,
          includeConfig: config.files_backup?.includeConfig ?? true,
          includeLogs: config.files_backup?.includeLogs ?? false,
          excludePatterns: config.files_backup?.excludePatterns ?? ["*.log", "node_modules", ".git"],
        },
        storage: {
          local: {
            enabled: config.storage?.local?.enabled ?? true,
            path: config.storage?.local?.path ?? "/backups",
            maxSize: config.storage?.local?.maxSize ?? 5000,
          },
          ftp: {
            enabled: config.storage?.ftp?.enabled ?? false,
            host: config.storage?.ftp?.host ?? "",
            port: config.storage?.ftp?.port ?? 21,
            username: config.storage?.ftp?.username ?? "",
            password: config.storage?.ftp?.password ?? "",
            remotePath: config.storage?.ftp?.remotePath ?? "/backups",
            passiveMode: config.storage?.ftp?.passiveMode ?? true,
          },
          s3: {
            enabled: config.storage?.s3?.enabled ?? false,
            accessKey: config.storage?.s3?.accessKey ?? "",
            secretKey: config.storage?.s3?.secretKey ?? "",
            bucket: config.storage?.s3?.bucket ?? "",
            region: config.storage?.s3?.region ?? "eu-west-1",
            endpoint: config.storage?.s3?.endpoint ?? "",
          },
          googleDrive: {
            enabled: config.storage?.googleDrive?.enabled ?? false,
            credentials: config.storage?.googleDrive?.credentials ?? "",
            folderId: config.storage?.googleDrive?.folderId ?? "",
          },
        },
        notifications: {
          enabled: config.notifications?.enabled ?? true,
          emailOnSuccess: config.notifications?.emailOnSuccess ?? false,
          emailOnFailure: config.notifications?.emailOnFailure ?? true,
          emailRecipients: config.notifications?.emailRecipients ?? [],
          webhookUrl: config.notifications?.webhookUrl ?? "",
          webhookEvents: config.notifications?.webhookEvents ?? [],
        },
        maintenance: {
          autoCleanup: config.maintenance?.autoCleanup ?? true,
          cleanupRetention: config.maintenance?.cleanupRetention ?? 30,
          verifyIntegrity: config.maintenance?.verifyIntegrity ?? true,
          testRestoration: config.maintenance?.testRestoration ?? false,
        },
      });
    }
  }, [config]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const updateConfig = useCallback((path: string, value: any) => {
    if (!localConfig) return;
    
    const keys = path.split(".");
    setLocalConfig((prev: any) => {
      if (!prev) return prev;
      const newConfig = { ...prev };
      let current: any = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  }, [localConfig]);

  const handleSaveConfig = useCallback(async () => {
    if (!localConfig) return;
    
    setIsSaving(true);
    try {
      const configToSave: Record<string, any> = {
        system_enabled: localConfig.enabled,
        encryption: {
          enabled: localConfig.encryptionEnabled,
          password: localConfig.encryptionPassword,
        },
        database_backup: {
          enabled: localConfig.databaseBackup.enabled,
          schedule: localConfig.databaseBackup.schedule,
          time: localConfig.databaseBackup.time,
          dayOfWeek: localConfig.databaseBackup.dayOfWeek,
          dayOfMonth: localConfig.databaseBackup.dayOfMonth,
          retention: localConfig.databaseBackup.retention,
          compression: localConfig.databaseBackup.compression,
          includeStoredProcedures: localConfig.databaseBackup.includeStoredProcedures,
          includeTriggers: localConfig.databaseBackup.includeTriggers,
          includeEvents: localConfig.databaseBackup.includeEvents,
          singleTransaction: localConfig.databaseBackup.singleTransaction,
          addDropStatements: localConfig.databaseBackup.addDropStatements,
        },
        files_backup: {
          enabled: localConfig.filesBackup.enabled,
          schedule: localConfig.filesBackup.schedule,
          time: localConfig.filesBackup.time,
          dayOfWeek: localConfig.filesBackup.dayOfWeek,
          dayOfMonth: localConfig.filesBackup.dayOfMonth,
          retention: localConfig.filesBackup.retention,
          compression: localConfig.filesBackup.compression,
          includeUploads: localConfig.filesBackup.includeUploads,
          includeConfig: localConfig.filesBackup.includeConfig,
          includeLogs: localConfig.filesBackup.includeLogs,
          excludePatterns: localConfig.filesBackup.excludePatterns,
        },
        storage: localConfig.storage,
        notifications: localConfig.notifications,
        maintenance: localConfig.maintenance,
      };
      
      const result = await saveConfig(configToSave);
      
      if (result.success) {
        toast.success("Configuración guardada correctamente");
      } else {
        toast.error(result.error || "Error al guardar la configuración");
      }
    } catch (err) {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  }, [localConfig, saveConfig]);

  const handleCreateBackup = useCallback(async (type: "database" | "files" | "full") => {
    setIsCreatingBackup(true);
    toast.loading(`Creando backup ${type}...`, { id: "backup" });
    
    try {
      const result = await createBackup(type);
      
      toast.dismiss("backup");
      
      if (result.success) {
        toast.success(`Backup de ${type} creado exitosamente`);
      } else {
        toast.error(result.error || "Error al crear el backup");
      }
    } catch (err) {
      toast.dismiss("backup");
      toast.error("Error al crear el backup");
    } finally {
      setIsCreatingBackup(false);
    }
  }, [createBackup]);

  const handleRestore = useCallback(async () => {
    if (!selectedBackup) return;
    
    setIsRestoring(true);
    toast.loading("Restaurando backup...", { id: "restore" });
    
    try {
      const result = await restoreBackup(selectedBackup.id, true);
      
      toast.dismiss("restore");
      
      if (result.success) {
        toast.success("Backup restaurado correctamente");
        setShowRestoreModal(false);
        setSelectedBackup(null);
      } else {
        toast.error(result.error || "Error al restaurar el backup");
      }
    } catch (err) {
      toast.dismiss("restore");
      toast.error("Error al restaurar el backup");
    } finally {
      setIsRestoring(false);
    }
  }, [selectedBackup, restoreBackup]);

  const handleDeleteBackup = useCallback(async (backupId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este backup?")) return;
    
    try {
      const result = await deleteBackup(backupId);
      
      if (result.success) {
        toast.success("Backup eliminado correctamente");
        loadLogs();
      } else {
        toast.error(result.error || "Error al eliminar el backup");
      }
    } catch (err) {
      toast.error("Error al eliminar el backup");
    }
  }, [deleteBackup, loadLogs]);

  const handleTestSftpConnection = useCallback(async () => {
    if (!localConfig) return;
    
    const ftpConfig = localConfig.storage.ftp;
    
    // Validar campos obligatorios
    if (!ftpConfig.host || !ftpConfig.port || !ftpConfig.username || !ftpConfig.password) {
      toast.error("Completa todos los campos obligatorios (host, puerto, usuario y contraseña)");
      return;
    }
    
    setIsTestingSftp(true);
    setSftpTestResult(null);
    toast.loading("Probando conexión SFTP...", { id: "sftp-test" });
    
    try {
      const result = await testSftpConnection({
        host: ftpConfig.host,
        port: ftpConfig.port,
        username: ftpConfig.username,
        password: ftpConfig.password,
        remotePath: ftpConfig.remotePath,
      });
      
      toast.dismiss("sftp-test");
      
      if (result.success) {
        setSftpTestResult({ success: true, message: "Conexión exitosa" });
        toast.success("Conexión SFTP exitosa");
      } else {
        setSftpTestResult({ success: false, message: result.error || "Error de conexión" });
        toast.error(result.error || "Error de conexión SFTP");
      }
    } catch (err) {
      toast.dismiss("sftp-test");
      setSftpTestResult({ success: false, message: "Error al probar la conexión" });
      toast.error("Error al probar la conexión SFTP");
    } finally {
      setIsTestingSftp(false);
    }
  }, [localConfig, testSftpConnection]);

  const handleVerifyIntegrity = useCallback(async (backupId: number) => {
    setVerifyingIntegrity(backupId);
    toast.loading("Verificando integridad del backup...", { id: "verify-integrity" });
    
    try {
      const result = await verifyIntegrity(backupId);
      
      toast.dismiss("verify-integrity");
      
      if (result.success) {
        if (result.isValid) {
          toast.success("Integridad verificada correctamente");
        } else if (result.isValid === null) {
          toast("El backup está cifrado - Verificación no disponible", { icon: "🔐" });
        } else {
          toast.error("⚠️ ALERTA: La integridad del backup está comprometida");
        }
        loadLogs();
      } else {
        toast.error(result.error || "Error al verificar integridad");
      }
    } catch (err) {
      toast.dismiss("verify-integrity");
      toast.error("Error al verificar integridad");
    } finally {
      setVerifyingIntegrity(null);
    }
  }, [verifyIntegrity, loadLogs]);

  const handleRunCleanup = useCallback(async (dryRun: boolean) => {
    toast.loading(dryRun ? "Simulando limpieza..." : "Ejecutando limpieza...", { id: "cleanup" });
    
    try {
      const result = await runCleanup(dryRun);
      
      toast.dismiss("cleanup");
      
      if (result.success) {
        if (dryRun) {
          toast.success(`Limpieza simulada: ${result.wouldDelete?.total || 0} backups serían eliminados`);
        } else {
          toast.success(`Limpieza completada: ${result.deleted?.count || 0} backups eliminados`);
        }
        loadLogs();
      } else {
        toast.error(result.error || "Error al ejecutar la limpieza");
      }
    } catch (err) {
      toast.dismiss("cleanup");
      toast.error("Error al ejecutar la limpieza");
    }
  }, [runCleanup, loadLogs]);

  // Handlers para programaciones de backup
  const handleOpenScheduleModal = useCallback((schedule?: any) => {
    if (schedule) {
      setEditingSchedule(schedule);
    } else {
      setEditingSchedule({
        name: "",
        backup_type: "full",
        schedule_type: "daily",
        time: "02:00",
        day_of_week: 1,
        day_of_month: 1,
        enabled: true,
      });
    }
    setShowScheduleModal(true);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    setShowScheduleModal(false);
    setEditingSchedule(null);
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    if (!editingSchedule) return;
    
    if (!editingSchedule.name || editingSchedule.name.trim() === "") {
      toast.error("El nombre es requerido");
      return;
    }
    
    setIsSavingSchedule(true);
    
    try {
      let result;
      if (editingSchedule.id) {
        result = await updateScheduledBackup(editingSchedule);
      } else {
        result = await createScheduledBackup(editingSchedule);
      }
      
      if (result.success) {
        toast.success(editingSchedule.id ? "Programación actualizada" : "Programación creada");
        handleCloseScheduleModal();
        loadScheduledBackups();
      } else {
        toast.error(result.error || "Error al guardar la programación");
      }
    } catch (err) {
      toast.error("Error al guardar la programación");
    } finally {
      setIsSavingSchedule(false);
    }
  }, [editingSchedule, createScheduledBackup, updateScheduledBackup, handleCloseScheduleModal, loadScheduledBackups]);

  const handleToggleSchedule = useCallback(async (schedule: any) => {
    try {
      const result = await updateScheduledBackup({
        id: schedule.id,
        enabled: !schedule.enabled,
      });
      
      if (result.success) {
        toast.success(`Programación ${schedule.enabled ? "deshabilitada" : "habilitada"}`);
        loadScheduledBackups();
      } else {
        toast.error(result.error || "Error al actualizar la programación");
      }
    } catch (err) {
      toast.error("Error al actualizar la programación");
    }
  }, [updateScheduledBackup, loadScheduledBackups]);

  const handleDeleteSchedule = useCallback(async (scheduleId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta programación?")) return;
    
    setDeletingSchedule(scheduleId);
    
    try {
      const result = await deleteScheduledBackup(scheduleId);
      
      if (result.success) {
        toast.success("Programación eliminada");
        loadScheduledBackups();
      } else {
        toast.error(result.error || "Error al eliminar la programación");
      }
    } catch (err) {
      toast.error("Error al eliminar la programación");
    } finally {
      setDeletingSchedule(null);
    }
  }, [deleteScheduledBackup, loadScheduledBackups]);

  const formatSchedule = useCallback((schedule: string, time: string, dayOfWeek?: number, dayOfMonth?: number) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    switch (schedule) {
      case "hourly": return "Cada hora";
      case "daily": return `Diario a las ${time}`;
      case "weekly": return `Semanal (${days[dayOfWeek!]}) a las ${time}`;
      case "monthly": return `Mensual (día ${dayOfMonth}) a las ${time}`;
      default: return schedule;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    switch (type) {
      case "database": return "Base de Datos";
      case "files": return "Archivos";
      case "full": return "Completo";
      case "restore": return "Restauración";
      case "cleanup": return "Limpieza";
      case "safety": return "Seguridad";
      default: return type;
    }
  }, []);

  const getLastBackupTime = useCallback(() => {
    if (!logs || logs.length === 0) return "Nunca";
    
    const lastBackup = logs.find(l => l.status === "success");
    if (!lastBackup) return "Nunca";
    
    const date = new Date(lastBackup.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    return "Hace un momento";
  }, [logs]);

  const getNextBackupTime = useCallback(() => {
    if (!localConfig?.databaseBackup?.enabled) return "No programado";
    
    const schedule = localConfig.databaseBackup.schedule;
    const time = localConfig.databaseBackup.time;
    
    return formatSchedule(schedule, time, localConfig.databaseBackup.dayOfWeek, localConfig.databaseBackup.dayOfMonth);
  }, [localConfig, formatSchedule]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando configuración de backups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Copias de Seguridad</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona las copias de seguridad de la base de datos y archivos</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleRunCleanup(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Simular Limpieza
            </button>
            <button
              onClick={() => handleRunCleanup(false)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
            >
              Limpiar Ahora
            </button>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">Estado del sistema:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${localConfig?.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {localConfig?.enabled ? "Activo" : "Desactivado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateBackup("database")}
          disabled={isCreatingBackup}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span>Backup DB</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateBackup("files")}
          disabled={isCreatingBackup}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-4 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span>Backup Archivos</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateBackup("full")}
          disabled={isCreatingBackup}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Backup Completo</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowRestoreModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-4 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Restaurar</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: "overview", label: "Resumen", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { id: "schedule", label: "Programación", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { id: "storage", label: "Almacenamiento", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4M4 15l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" },
            { id: "notifications", label: "Notificaciones", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
            { id: "logs", label: "Historial", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Último Backup</p>
                    <p className="text-2xl font-bold text-gray-900">{getLastBackupTime()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Backups Totales</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Espacio Usado</p>
                    <p className="text-2xl font-bold text-gray-900">{storage?.used?.formatted || "0 Bytes"}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Próximo Backup</p>
                    <p className="text-2xl font-bold text-gray-900">{getNextBackupTime()}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Scheduled Backups */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Próximos Backups Programados</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Base de Datos</p>
                        <p className="text-sm text-gray-500">{localConfig ? formatSchedule(localConfig.databaseBackup.schedule, localConfig.databaseBackup.time, localConfig.databaseBackup.dayOfWeek, localConfig.databaseBackup.dayOfMonth) : 'Cargando...'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Programado</p>
                      <p className="text-xs text-gray-500">{localConfig?.databaseBackup.time || '02:00'} AM</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-2 rounded">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Archivos</p>
                        <p className="text-sm text-gray-500">{localConfig ? formatSchedule(localConfig.filesBackup.schedule, localConfig.filesBackup.time, localConfig.filesBackup.dayOfWeek, localConfig.filesBackup.dayOfMonth) : 'Cargando...'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Programado</p>
                      <p className="text-xs text-gray-500">{localConfig?.filesBackup.time || '03:00'} AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        log.status === "success" ? "bg-green-100" : log.status === "failed" ? "bg-red-100" : "bg-yellow-100"
                      }`}>
                        <svg className={`w-4 h-4 ${
                          log.status === "success" ? "text-green-600" : log.status === "failed" ? "text-red-600" : "text-yellow-600"
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {log.status === "success" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : log.status === "failed" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getTypeLabel(log.type)}</p>
                        <p className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{log.sizeFormatted || "0 Bytes"}</p>
                        <p className="text-xs text-gray-500">{log.duration}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === "success" ? "Exitoso" : log.status === "failed" ? "Fallido" : "En progreso"}
                      </span>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No hay backups registrados todavía
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "storage" && localConfig && (
          <motion.div
            key="storage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Almacenamiento Local</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.storage.local.enabled}
                        onChange={(e) => updateConfig("storage.local.enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ruta</label>
                    <input
                      type="text"
                      value={localConfig.storage.local.path}
                      onChange={(e) => updateConfig("storage.local.path", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño máximo (MB)</label>
                    <input
                      type="number"
                      value={localConfig.storage.local.maxSize}
                      onChange={(e) => updateConfig("storage.local.maxSize", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">FTP / SFTP</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.storage.ftp.enabled}
                        onChange={(e) => updateConfig("storage.ftp.enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Host <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={localConfig.storage.ftp.host}
                        onChange={(e) => {
                          updateConfig("storage.ftp.host", e.target.value);
                          setSftpTestResult(null);
                        }}
                        placeholder="servidor.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puerto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={localConfig.storage.ftp.port}
                        onChange={(e) => {
                          updateConfig("storage.ftp.port", parseInt(e.target.value));
                          setSftpTestResult(null);
                        }}
                        min={1}
                        max={65535}
                        placeholder="22"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">22 para SFTP, 21 para FTP</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usuario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={localConfig.storage.ftp.username}
                      onChange={(e) => {
                        updateConfig("storage.ftp.username", e.target.value);
                        setSftpTestResult(null);
                      }}
                      placeholder="usuario_servidor"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={localConfig.storage.ftp.password}
                      onChange={(e) => {
                        updateConfig("storage.ftp.password", e.target.value);
                        setSftpTestResult(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">La contraseña se almacena de forma segura</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ruta remota</label>
                    <input
                      type="text"
                      value={localConfig.storage.ftp.remotePath}
                      onChange={(e) => {
                        updateConfig("storage.ftp.remotePath", e.target.value);
                        setSftpTestResult(null);
                      }}
                      placeholder="/backups"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ruta donde se almacenarán los backups en el servidor</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.storage.ftp.passiveMode}
                      onChange={(e) => updateConfig("storage.ftp.passiveMode", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Modo pasivo (para FTP)</span>
                  </label>
                  
                  {/* Resultado de prueba de conexión */}
                  {sftpTestResult && (
                    <div className={`rounded-lg p-4 ${
                      sftpTestResult.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {sftpTestResult.success ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={`ml-2 text-sm font-medium ${
                          sftpTestResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {sftpTestResult.message}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Botón de prueba de conexión */}
                  <div className="pt-2">
                    <button
                      onClick={handleTestSftpConnection}
                      disabled={isTestingSftp || !localConfig.storage.ftp.enabled}
                      className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                        isTestingSftp || !localConfig.storage.ftp.enabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isTestingSftp ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Probando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Probar conexión</span>
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Es necesario guardar la configuración después de probar la conexión
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Amazon S3</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.storage.s3.enabled}
                        onChange={(e) => updateConfig("storage.s3.enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Key</label>
                    <input
                      type="text"
                      value={localConfig.storage.s3.accessKey}
                      onChange={(e) => updateConfig("storage.s3.accessKey", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={localConfig.storage.s3.secretKey}
                      onChange={(e) => updateConfig("storage.s3.secretKey", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bucket</label>
                      <input
                        type="text"
                        value={localConfig.storage.s3.bucket}
                        onChange={(e) => updateConfig("storage.s3.bucket", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Región</label>
                      <select
                        value={localConfig.storage.s3.region}
                        onChange={(e) => updateConfig("storage.s3.region", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">EU (Ireland)</option>
                        <option value="eu-central-1">EU (Frankfurt)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint personalizado (opcional)</label>
                    <input
                      type="text"
                      value={localConfig.storage.s3.endpoint}
                      onChange={(e) => updateConfig("storage.s3.endpoint", e.target.value)}
                      placeholder="Para S3-compatible storage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Google Drive</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.storage.googleDrive.enabled}
                        onChange={(e) => updateConfig("storage.googleDrive.enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credenciales JSON</label>
                    <textarea
                      value={localConfig.storage.googleDrive.credentials}
                      onChange={(e) => updateConfig("storage.googleDrive.credentials", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Pega el contenido del archivo JSON de credenciales"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID de carpeta</label>
                    <input
                      type="text"
                      value={localConfig.storage.googleDrive.folderId}
                      onChange={(e) => updateConfig("storage.googleDrive.folderId", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Cifrado de Backups</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.encryptionEnabled}
                      onChange={(e) => setLocalConfig({ ...localConfig, encryptionEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              {localConfig.encryptionEnabled && (
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña de cifrado</label>
                    <input
                      type="password"
                      value={localConfig.encryptionPassword}
                      onChange={(e) => setLocalConfig({ ...localConfig, encryptionPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Usa AES-256 para cifrar los archivos de backup</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && localConfig && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Configuración de Notificaciones</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifications.enabled}
                      onChange={(e) => updateConfig("notifications.enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              {localConfig.notifications.enabled && (
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.notifications.emailOnSuccess}
                        onChange={(e) => updateConfig("notifications.emailOnSuccess", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notificar por email en backup exitoso</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.notifications.emailOnFailure}
                        onChange={(e) => updateConfig("notifications.emailOnFailure", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notificar por email en backup fallido</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios de email</label>
                    <textarea
                      value={localConfig.notifications.emailRecipients.join("\n")}
                      onChange={(e) => updateConfig("notifications.emailRecipients", e.target.value.split("\n"))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Un email por línea"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Webhook</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL del webhook</label>
                        <input
                          type="url"
                          value={localConfig.notifications.webhookUrl}
                          onChange={(e) => updateConfig("notifications.webhookUrl", e.target.value)}
                          placeholder="https://tu-servidor.com/webhook"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eventos a notificar</label>
                        <div className="space-y-2">
                          {["backup_started", "backup_completed", "backup_failed", "restore_started", "restore_completed", "restore_failed"].map((event) => (
                            <label key={event} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={localConfig.notifications.webhookEvents.includes(event)}
                                onChange={(e) => {
                                  const events = e.target.checked
                                    ? [...localConfig.notifications.webhookEvents, event]
                                    : localConfig.notifications.webhookEvents.filter((e) => e !== event);
                                  updateConfig("notifications.webhookEvents", events);
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{event}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Mantenimiento</h3>
              </div>
              <div className="p-6 space-y-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.maintenance.autoCleanup}
                    onChange={(e) => updateConfig("maintenance.autoCleanup", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Limpieza automática de backups antiguos</span>
                </label>

                {localConfig.maintenance.autoCleanup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eliminar backups más antiguos de (días)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={localConfig.maintenance.cleanupRetention}
                      onChange={(e) => updateConfig("maintenance.cleanupRetention", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.maintenance.verifyIntegrity}
                    onChange={(e) => updateConfig("maintenance.verifyIntegrity", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Verificar integridad de backups después de crearlos</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.maintenance.testRestoration}
                    onChange={(e) => updateConfig("maintenance.testRestoration", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Probar restauración periódicamente (en entorno de staging)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Historial de Backups</h3>
                  <button 
                    onClick={() => loadLogs()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.type === "database" ? "bg-blue-100 text-blue-800" :
                            log.type === "files" ? "bg-purple-100 text-purple-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {getTypeLabel(log.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status === "success" ? "Exitoso" : log.status === "failed" ? "Fallido" : "En progreso"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.sizeFormatted || "0 Bytes"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {log.status === "success" && log.checksum && (
                              <button 
                                className={`${verifyingIntegrity === log.id ? 'text-gray-400 cursor-wait' : 'text-teal-600 hover:text-teal-800'}`}
                                title="Verificar integridad SHA-256"
                                disabled={verifyingIntegrity === log.id}
                                onClick={() => handleVerifyIntegrity(log.id)}
                              >
                                {verifyingIntegrity === log.id ? (
                                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                )}
                              </button>
                            )}
                            {log.status === "success" && (
                              <>
                                <button 
                                  className="text-blue-600 hover:text-blue-800" 
                                  title="Descargar"
                                  onClick={() => {
                                    if (log.filePath) {
                                      window.open(`/api/admin/backup/download?id=${log.id}`, '_blank');
                                    } else {
                                      toast.error("Ruta de archivo no disponible");
                                    }
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                                <button 
                                  className="text-green-600 hover:text-green-800" 
                                  title="Restaurar"
                                  onClick={() => {
                                    setSelectedBackup(log);
                                    setShowRestoreModal(true);
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <button 
                              className="text-red-600 hover:text-red-800" 
                              title="Eliminar"
                              onClick={() => handleDeleteBackup(log.id)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No hay backups registrados todavía
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Backups Programados</h3>
                      <p className="text-sm text-gray-500">Gestiona los backups automáticos que se ejecutarán según el cronograma</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenScheduleModal()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nuevo Backup Programado</span>
                  </button>
                </div>
              </div>
              
              {/* Cron URL Info */}
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium">Cómo funcionan los backups automáticos</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Los backups programados se ejecutan mediante el endpoint <code className="bg-blue-100 px-1 rounded">/api/cron/backup</code>. 
                      Necesitas configurar un servicio externo (cron-job.org, crontab, etc.) para llamar a esta URL periódicamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scheduled Backups List */}
              <div className="divide-y divide-gray-200">
                {scheduledBackups.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-600 mb-2">No hay backups programados</p>
                    <p className="text-sm">Crea tu primera programación de backup haciendo clic en el botón de arriba.</p>
                  </div>
                ) : (
                  scheduledBackups.map((schedule: any) => (
                    <div key={schedule.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${schedule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <svg className={`w-6 h-6 ${schedule.enabled ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">{schedule.name}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                schedule.backup_type === 'full' ? 'bg-purple-100 text-purple-700' :
                                schedule.backup_type === 'database' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {schedule.backup_type === 'full' ? 'Completo' :
                                 schedule.backup_type === 'database' ? 'Base de Datos' : 'Archivos'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                schedule.schedule_type === 'hourly' ? 'bg-yellow-100 text-yellow-700' :
                                schedule.schedule_type === 'daily' ? 'bg-green-100 text-green-700' :
                                schedule.schedule_type === 'weekly' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {schedule.schedule_type === 'hourly' ? 'Cada hora' :
                                 schedule.schedule_type === 'daily' ? 'Diario' :
                                 schedule.schedule_type === 'weekly' ? 'Semanal' : 'Mensual'}
                                {schedule.schedule_type !== 'hourly' && ` - ${schedule.time?.substring(0, 5) || '02:00'}`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              {schedule.last_run ? (
                                <span>Última ejecución: {new Date(schedule.last_run).toLocaleString('es-ES')}</span>
                              ) : (
                                <span className="text-yellow-600">Nunca ejecutado</span>
                              )}
                              {schedule.next_run ? (
                                <span>Próxima: {new Date(schedule.next_run).toLocaleString('es-ES')}</span>
                              ) : (
                                <span className="text-gray-400">Sin programar</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={schedule.enabled}
                              onChange={() => handleToggleSchedule(schedule)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <button
                            onClick={() => handleOpenScheduleModal(schedule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={deletingSchedule === schedule.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deletingSchedule === schedule.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      {showScheduleModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSchedule.id ? "Editar Backup Programado" : "Nuevo Backup Programado"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSchedule.name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Backup Diario Completo"
                />
              </div>

              {/* Tipo de Backup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Backup</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "database", label: "Base de Datos", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7", color: "blue" },
                    { value: "files", label: "Archivos", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4", color: "green" },
                    { value: "full", label: "Completo", icon: "M12 10v6m0 0l-3-3m3 3l3-3", color: "purple" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEditingSchedule({ ...editingSchedule, backup_type: type.value })}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 transition-all ${
                        editingSchedule.backup_type === type.value
                          ? type.color === "blue" ? "border-blue-500 bg-blue-50" :
                            type.color === "green" ? "border-green-500 bg-green-50" :
                            "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <svg className={`w-6 h-6 ${
                        editingSchedule.backup_type === type.value
                          ? type.color === "blue" ? "text-blue-600" :
                            type.color === "green" ? "text-green-600" :
                            "text-purple-600"
                          : "text-gray-500"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
                      </svg>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Programación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Programación</label>
                <select
                  value={editingSchedule.schedule_type}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, schedule_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                <input
                  type="time"
                  value={editingSchedule.time?.substring(0, 5) || "02:00"}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value + ":00" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Día de la semana (solo si es semanal) */}
              {editingSchedule.schedule_type === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Día de la semana</label>
                  <select
                    value={editingSchedule.day_of_week ?? 1}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_week: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                  </select>
                </div>
              )}

              {/* Día del mes (solo si es mensual) */}
              {editingSchedule.schedule_type === "monthly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Día del mes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingSchedule.day_of_month ?? 1}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="1-31"
                  />
                </div>
              )}

              {/* Habilitado */}
              <div className="flex items-center space-x-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSchedule.enabled}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus-outline-none peer-focus-ring-4 peer-focus-ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <span className="text-sm text-gray-700">Habilitado</span>
              </div>

              {/* Resumen de la programación */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600">
                  <strong>Resumen:</strong> El backup de <strong>{editingSchedule.name || "sin nombre"}</strong> ({editingSchedule.backup_type}) 
                  se ejecutará <strong>{
                    editingSchedule.schedule_type === "hourly" ? "cada hora" :
                    editingSchedule.schedule_type === "daily" ? "diariamente" :
                    editingSchedule.schedule_type === "weekly" ? "semanalmente" : "mensualmente"
                  }</strong> 
                  {editingSchedule.schedule_type !== "hourly" && ` a las ${editingSchedule.time?.substring(0, 5) || "02:00"}`}
                  {editingSchedule.schedule_type === "weekly" && ` los ${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][editingSchedule.day_of_week ?? 0]}`}
                  {editingSchedule.schedule_type === "monthly" && ` el día ${editingSchedule.day_of_month ?? 1}`}.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white rounded-b-lg">
              <button
                onClick={handleCloseScheduleModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                disabled={isSavingSchedule}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                {isSavingSchedule && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{editingSchedule.id ? "Guardar Cambios" : "Crear Programación"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Restaurar Backup</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que deseas restaurar este backup? Esta acción reemplazará todos los datos actuales.
              </p>
              {selectedBackup && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm"><span className="font-medium">Fecha:</span> {new Date(selectedBackup.createdAt).toLocaleString()}</p>
                  <p className="text-sm"><span className="font-medium">Tipo:</span> {getTypeLabel(selectedBackup.type)}</p>
                  <p className="text-sm"><span className="font-medium">Tamaño:</span> {selectedBackup.sizeFormatted || "0 Bytes"}</p>
                </div>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="ml-2 text-sm text-yellow-800">
                    Se recomienda hacer un backup de los datos actuales antes de restaurar.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                disabled={isRestoring}
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isRestoring ? "Restaurando..." : "Restaurar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupSection;
