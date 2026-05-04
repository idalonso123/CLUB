import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import fs from "fs";
import path from "path";

interface BackupConfig {
  database_backup?: {
    retention?: number;
    enabled?: boolean;
    schedule?: string;
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    compression?: string;
    includeStoredProcedures?: boolean;
    includeTriggers?: boolean;
    includeEvents?: boolean;
    singleTransaction?: boolean;
    addDropStatements?: boolean;
  };
  files_backup?: {
    retention?: number;
    enabled?: boolean;
    schedule?: string;
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    compression?: string;
    includeUploads?: boolean;
    includeConfig?: boolean;
    includeLogs?: boolean;
    excludePatterns?: string[];
  };
  maintenance?: {
    autoCleanup?: boolean;
    cleanupRetention?: number;
    verifyIntegrity?: boolean;
    testRestoration?: boolean;
  };
  storage_local?: {
    enabled?: boolean;
    path?: string;
    maxSize?: number;
  };
  [key: string]: any;
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
        config[row.config_key] = JSON.parse(row.config_value);
      } catch {
        config[row.config_key] = row.config_value;
      }
    }

    return config;
  } catch (error) {
    console.error("Error al obtener configuración de backup:", error);
    return {};
  }
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // POST: Ejecutar limpieza de backups antiguos
  if (req.method === "POST") {
    try {
      const { dryRun = false } = req.body;
      const config = await getBackupConfig();
      const userId = req.user?.userId || null;

      const dbRetention = config.database_backup?.retention || 30;
      const filesRetention = config.files_backup?.retention || 14;
      const autoCleanup = config.maintenance?.autoCleanup ?? true;

      // Si no está habilitado el auto cleanup y no es una ejecución manual, no hacer nada
      if (!autoCleanup && !dryRun) {
        return res.status(400).json({
          success: false,
          message: "La limpieza automática no está habilitada en la configuración",
        });
      }

      // Calcular fechas de corte
      const dbCutoffDate = new Date();
      dbCutoffDate.setDate(dbCutoffDate.getDate() - dbRetention);

      const filesCutoffDate = new Date();
      filesCutoffDate.setDate(filesCutoffDate.getDate() - filesRetention);

      // Obtener backups antiguos de base de datos
      let oldDbBackups: any[] = [];
      try {
        oldDbBackups = (await executeQuery({
          query: `
            SELECT id, file_path, backup_type, created_at, file_size, status
            FROM backup_logs
            WHERE backup_type IN ('database', 'full')
            AND status = 'success'
            AND created_at < ?
            ORDER BY created_at ASC
          `,
          values: [dbCutoffDate.toISOString().slice(0, 19).replace("T", " ")],
        })) as any[];
      } catch (error) {
        console.error("Error al obtener backups de base de datos:", error);
        oldDbBackups = [];
      }

      // Obtener backups antiguos de archivos
      let oldFilesBackups: any[] = [];
      try {
        oldFilesBackups = (await executeQuery({
          query: `
            SELECT id, file_path, backup_type, created_at, file_size, status
            FROM backup_logs
            WHERE backup_type = 'files'
            AND status = 'success'
            AND created_at < ?
            ORDER BY created_at ASC
          `,
          values: [filesCutoffDate.toISOString().slice(0, 19).replace("T", " ")],
        })) as any[];
      } catch (error) {
        console.error("Error al obtener backups de archivos:", error);
        oldFilesBackups = [];
      }

      const allOldBackups = [...oldDbBackups, ...oldFilesBackups];
      const deletedFiles: string[] = [];
      const deletedIds: number[] = [];
      let totalSizeFreed = 0;
      const errors: string[] = [];

      if (!dryRun) {
        for (const backup of allOldBackups) {
          try {
            // Eliminar archivo físico si existe
            if (backup.file_path) {
              try {
                if (fs.existsSync(backup.file_path)) {
                  const stats = fs.statSync(backup.file_path);
                  totalSizeFreed += stats.size;
                  fs.unlinkSync(backup.file_path);
                  deletedFiles.push(backup.file_path);
                }
              } catch (fileError: any) {
                console.error(
                  `Error al eliminar archivo físico ${backup.file_path}:`,
                  fileError
                );
                errors.push(
                  `No se pudo eliminar archivo: ${backup.file_path} - ${fileError.message}`
                );
              }
            }

            // Eliminar registro de la base de datos
            try {
              await executeQuery({
                query: "DELETE FROM backup_logs WHERE id = ?",
                values: [backup.id],
              });
              deletedIds.push(backup.id);
            } catch (deleteError: any) {
              console.error(
                `Error al eliminar registro ${backup.id}:`,
                deleteError
              );
              errors.push(
                `No se pudo eliminar registro ${backup.id}: ${deleteError.message}`
              );
            }
          } catch (loopError: any) {
            console.error(`Error general al procesar backup ${backup.id}:`, loopError);
            errors.push(
              `Error al procesar backup ${backup.id}: ${loopError.message}`
            );
          }
        }

        // Registrar la limpieza como un nuevo backup de tipo cleanup
        if (deletedIds.length > 0) {
          try {
            await executeQuery({
              query: `
                INSERT INTO backup_logs 
                (backup_type, status, file_path, file_size, duration_seconds, 
                 created_by, completed_at)
                VALUES ('cleanup', 'success', ?, ?, 0, ?, NOW())
              `,
              values: [
                `Limpieza: ${deletedIds.length} backups eliminados`,
                totalSizeFreed,
                userId,
              ],
            });
          } catch (logError) {
            console.error("Error al registrar la limpieza:", logError);
          }
        }
      }

      const totalOldSize = allOldBackups.reduce(
        (sum: number, b: any) => sum + (b.file_size || 0),
        0
      );

      return res.status(200).json({
        success: true,
        message: dryRun
          ? "Simulación de limpieza completada"
          : "Limpieza completada correctamente",
        dryRun,
        deleted: {
          count: deletedIds.length,
          ids: deletedIds,
          files: deletedFiles,
          sizeFreed: totalSizeFreed,
          sizeFreedFormatted: formatBytes(totalSizeFreed),
        },
        wouldDelete: {
          databaseBackups: oldDbBackups.length,
          filesBackups: oldFilesBackups.length,
          total: allOldBackups.length,
          totalSize: totalOldSize,
          totalSizeFormatted: formatBytes(totalOldSize),
        },
        retention: {
          database: dbRetention,
          files: filesRetention,
          databaseCutoffDate: dbCutoffDate.toISOString(),
          filesCutoffDate: filesCutoffDate.toISOString(),
        },
        errors: errors.length > 0 ? errors : undefined,
        config: {
          autoCleanup,
          maintenanceEnabled: !!config.maintenance,
        },
      });
    } catch (error: any) {
      console.error("Error en la limpieza de backups:", error);

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
        message: "Error al ejecutar la limpieza",
        error: error.message || "Error desconocido",
      });
    }
  }

  // GET: Obtener estadísticas de almacenamiento
  if (req.method === "GET") {
    try {
      const config = await getBackupConfig();

      // Obtener todos los backups agrupados por tipo
      let allBackups: any[] = [];
      try {
        allBackups = (await executeQuery({
          query: `
            SELECT 
              backup_type,
              COUNT(*) as count,
              COALESCE(SUM(file_size), 0) as total_size,
              MAX(created_at) as latest,
              MIN(created_at) as oldest
            FROM backup_logs
            WHERE status = 'success'
            GROUP BY backup_type
            ORDER BY backup_type ASC
          `,
          values: [],
        })) as any[];
      } catch (error) {
        console.error("Error al obtener backups por tipo:", error);
        allBackups = [];
      }

      // Obtener espacio total usado
      let totalSpace: any[] = [];
      try {
        totalSpace = (await executeQuery({
          query: `
            SELECT 
              COALESCE(SUM(file_size), 0) as total_size,
              COUNT(*) as total_count
            FROM backup_logs
            WHERE status = 'success'
          `,
          values: [],
        })) as any[];
      } catch (error) {
        console.error("Error al obtener espacio total:", error);
        totalSpace = [{ total_size: 0, total_count: 0 }];
      }

      // Obtener estadísticas por estado
      let statusStats: any[] = [];
      try {
        statusStats = (await executeQuery({
          query: `
            SELECT 
              status,
              COUNT(*) as count,
              COALESCE(SUM(file_size), 0) as total_size
            FROM backup_logs
            GROUP BY status
            ORDER BY status ASC
          `,
          values: [],
        })) as any[];
      } catch (error) {
        console.error("Error al obtener estadísticas por estado:", error);
        statusStats = [];
      }

      const usedSpaceBytes = totalSpace[0]?.total_size || 0;
      const usedSpaceMB = usedSpaceBytes / (1024 * 1024);
      const maxSizeMB = config.storage_local?.maxSize || 5000;
      const availableSpaceMB = Math.max(0, maxSizeMB - usedSpaceMB);
      const usagePercentage = maxSizeMB > 0 ? (usedSpaceMB / maxSizeMB) * 100 : 0;

      return res.status(200).json({
        success: true,
        storage: {
          used: {
            bytes: usedSpaceBytes,
            formatted: formatBytes(usedSpaceBytes),
            megabytes: Math.round(usedSpaceMB * 100) / 100,
          },
          available: {
            bytes: Math.floor(availableSpaceMB * 1024 * 1024),
            formatted: formatBytes(availableSpaceMB * 1024 * 1024),
            megabytes: Math.round(availableSpaceMB * 100) / 100,
          },
          max: {
            bytes: maxSizeMB * 1024 * 1024,
            formatted: formatBytes(maxSizeMB * 1024 * 1024),
            megabytes: maxSizeMB,
          },
          usagePercentage: Math.round(usagePercentage * 100) / 100,
        },
        byType: allBackups.map((item: any) => ({
          type: item.backup_type,
          count: item.count || 0,
          totalSize: item.total_size || 0,
          totalSizeFormatted: formatBytes(item.total_size || 0),
          latest: item.latest,
          oldest: item.oldest,
        })),
        byStatus: statusStats.map((item: any) => ({
          status: item.status,
          count: item.count || 0,
          totalSize: item.total_size || 0,
          totalSizeFormatted: formatBytes(item.total_size || 0),
        })),
        totalCount: totalSpace[0]?.total_count || 0,
        retention: {
          database: config.database_backup?.retention || 30,
          files: config.files_backup?.retention || 14,
          autoCleanup: config.maintenance?.autoCleanup ?? true,
        },
        config: {
          storageEnabled: config.storage_local?.enabled ?? true,
          storagePath: config.storage_local?.path || "/backups",
        },
      });
    } catch (error: any) {
      console.error("Error al obtener estadísticas:", error);

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
        message: "Error al obtener las estadísticas",
        error: error.message || "Error desconocido",
      });
    }
  }

  // DELETE: Eliminar todos los backups de un tipo específico (mantenimiento)
  if (req.method === "DELETE") {
    try {
      const { type, olderThanDays } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el tipo de backup a eliminar",
        });
      }

      const validTypes = ["database", "files", "full", "cleanup"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de backup inválido. Valores válidos: ${validTypes.join(", ")}`,
        });
      }

      const cutoffDate = new Date();
      if (olderThanDays) {
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays, 10));
      }

      // Obtener backups a eliminar
      let backupsToDelete: any[] = [];
      try {
        backupsToDelete = (await executeQuery({
          query: `
            SELECT id, file_path, backup_type, file_size
            FROM backup_logs
            WHERE backup_type = ?
            AND created_at < ?
            AND status = 'success'
          `,
          values: [type, cutoffDate.toISOString().slice(0, 19).replace("T", " ")],
        })) as any[];
      } catch (error) {
        console.error("Error al buscar backups:", error);
        return res.status(500).json({
          success: false,
          message: "Error al buscar backups para eliminar",
          error: (error as Error).message,
        });
      }

      const deletedIds: number[] = [];
      const deletedFiles: string[] = [];
      let totalSizeFreed = 0;

      for (const backup of backupsToDelete) {
        try {
          // Eliminar archivo físico
          if (backup.file_path && fs.existsSync(backup.file_path)) {
            const stats = fs.statSync(backup.file_path);
            totalSizeFreed += stats.size;
            fs.unlinkSync(backup.file_path);
            deletedFiles.push(backup.file_path);
          }

          // Eliminar registro
          await executeQuery({
            query: "DELETE FROM backup_logs WHERE id = ?",
            values: [backup.id],
          });
          deletedIds.push(backup.id);
        } catch (deleteError) {
          console.error(`Error al eliminar backup ${backup.id}:`, deleteError);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Eliminación completada: ${deletedIds.length} backups de tipo '${type}' eliminados`,
        deleted: {
          count: deletedIds.length,
          ids: deletedIds,
          files: deletedFiles,
          sizeFreed: totalSizeFreed,
          sizeFreedFormatted: formatBytes(totalSizeFreed),
        },
        criteria: {
          type,
          olderThanDays: olderThanDays || "todos",
          cutoffDate: cutoffDate.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error al eliminar backups:", error);

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
        message: "Error al eliminar los backups",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
