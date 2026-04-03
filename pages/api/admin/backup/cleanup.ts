import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import fs from "fs";
import path from "path";

async function getBackupConfig(): Promise<Record<string, any>> {
  const rows = await executeQuery({
    query: "SELECT config_key, config_value FROM backup_config",
    values: [],
  }) as any[];

  const config: Record<string, any> = {};
  
  for (const row of rows) {
    try {
      config[row.config_key] = JSON.parse(row.config_value);
    } catch {
      config[row.config_key] = row.config_value;
    }
  }
  
  return config;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // POST: Ejecutar limpieza de backups antiguos
  if (req.method === "POST") {
    try {
      const { dryRun } = req.body;
      const config = await getBackupConfig();
      const userId = req.user?.userId || 0;
      
      const dbRetention = config.database_backup?.retention || 30;
      const filesRetention = config.files_backup?.retention || 14;
      const autoCleanup = config.maintenance?.autoCleanup;

      // Si no está habilitado el auto cleanup y no es una ejecución manual, no hacer nada
      if (!autoCleanup && !dryRun) {
        return res.status(400).json({
          success: false,
          message: "La limpieza automática no está habilitada",
        });
      }

      // Calcular fechas de corte
      const dbCutoffDate = new Date();
      dbCutoffDate.setDate(dbCutoffDate.getDate() - dbRetention);
      
      const filesCutoffDate = new Date();
      filesCutoffDate.setDate(filesCutoffDate.getDate() - filesRetention);

      // Obtener backups antiguos de base de datos
      const oldDbBackups = await executeQuery({
        query: `
          SELECT id, file_path, backup_type, created_at, file_size
          FROM backup_logs
          WHERE backup_type IN ('database', 'full')
          AND status = 'success'
          AND created_at < ?
          ORDER BY created_at ASC
        `,
        values: [dbCutoffDate.toISOString()],
      }) as any[];

      // Obtener backups antiguos de archivos
      const oldFilesBackups = await executeQuery({
        query: `
          SELECT id, file_path, backup_type, created_at, file_size
          FROM backup_logs
          WHERE backup_type = 'files'
          AND status = 'success'
          AND created_at < ?
          ORDER BY created_at ASC
        `,
        values: [filesCutoffDate.toISOString()],
      }) as any[];

      const allOldBackups = [...oldDbBackups, ...oldFilesBackups];
      const deletedFiles: string[] = [];
      const deletedIds: number[] = [];
      let totalSizeFreed = 0;

      if (!dryRun) {
        for (const backup of allOldBackups) {
          try {
            // Eliminar archivo físico
            if (backup.file_path && fs.existsSync(backup.file_path)) {
              const stats = fs.statSync(backup.file_path);
              totalSizeFreed += stats.size;
              fs.unlinkSync(backup.file_path);
              deletedFiles.push(backup.file_path);
            }
            
            // Eliminar registro de la base de datos
            await executeQuery({
              query: "DELETE FROM backup_logs WHERE id = ?",
              values: [backup.id],
            });
            
            deletedIds.push(backup.id);
          } catch (deleteError) {
            console.error(`Error al eliminar backup ${backup.id}:`, deleteError);
          }
        }

        // Registrar la limpieza
        await executeQuery({
          query: `
            INSERT INTO backup_logs 
            (backup_type, status, description, file_size, created_by)
            VALUES ('cleanup', 'success', ?, ?, ?)
          `,
          values: [
            `Limpieza automática: ${deletedIds.length} backups eliminados`,
            totalSizeFreed,
            userId
          ],
        });
      }

      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      return res.status(200).json({
        success: true,
        message: dryRun ? 'Simulación de limpieza completada' : 'Limpieza completada',
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
          totalSize: allOldBackups.reduce((sum: number, b: any) => sum + (b.file_size || 0), 0),
        },
        retention: {
          database: dbRetention,
          files: filesRetention,
        },
      });
    } catch (error) {
      console.error("Error en la limpieza de backups:", error);
      return res.status(500).json({
        success: false,
        message: "Error al ejecutar la limpieza",
        error: (error as Error).message,
      });
    }
  }

  // GET: Obtener estadísticas de almacenamiento
  if (req.method === "GET") {
    try {
      const config = await getBackupConfig();
      
      // Obtener todos los backups
      const allBackups = await executeQuery({
        query: `
          SELECT 
            backup_type,
            COUNT(*) as count,
            SUM(file_size) as total_size,
            MAX(created_at) as latest
          FROM backup_logs
          WHERE status = 'success'
          GROUP BY backup_type
        `,
        values: [],
      }) as any[];

      // Obtener espacio total usado
      const totalSpace = await executeQuery({
        query: `
          SELECT 
            SUM(file_size) as total_size,
            COUNT(*) as total_count
          FROM backup_logs
          WHERE status = 'success'
        `,
        values: [],
      }) as any[];

      const formatBytes = (bytes: number): string => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Calcular espacio disponible
      const maxSize = config.storage_local?.maxSize || 5000; // MB por defecto
      const usedSpace = (totalSpace[0]?.total_size || 0) / (1024 * 1024); // Convertir a MB
      const availableSpace = Math.max(0, maxSize - usedSpace);
      const usagePercentage = (usedSpace / maxSize) * 100;

      return res.status(200).json({
        success: true,
        storage: {
          used: {
            bytes: totalSpace[0]?.total_size || 0,
            formatted: formatBytes(totalSpace[0]?.total_size || 0),
            megabytes: Math.round(usedSpace * 100) / 100,
          },
          available: {
            bytes: Math.floor(availableSpace * 1024 * 1024),
            formatted: formatBytes(availableSpace * 1024 * 1024),
            megabytes: Math.round(availableSpace * 100) / 100,
          },
          max: {
            bytes: maxSize * 1024 * 1024,
            formatted: formatBytes(maxSize * 1024 * 1024),
            megabytes: maxSize,
          },
          usagePercentage: Math.round(usagePercentage * 100) / 100,
        },
        byType: allBackups.map((item: any) => ({
          type: item.backup_type,
          count: item.count,
          totalSize: item.total_size,
          totalSizeFormatted: formatBytes(item.total_size || 0),
          latest: item.latest,
        })),
        retention: {
          database: config.database_backup?.retention || 30,
          files: config.files_backup?.retention || 14,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener las estadísticas",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
