import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

function getDatabaseConnection(): { host: string; port: number; user: string; password: string; database: string } {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'viveverde',
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // POST: Restaurar backup
  if (req.method === "POST") {
    try {
      const { backupId, createBackupBefore } = req.body;
      
      if (!backupId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup a restaurar",
        });
      }

      // Obtener información del backup
      const backupInfo = await executeQuery({
        query: "SELECT * FROM backup_logs WHERE id = ?",
        values: [backupId],
      }) as any[];

      if (!backupInfo || backupInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Backup no encontrado",
        });
      }

      const backup = backupInfo[0];
      
      if (backup.status !== 'success') {
        return res.status(400).json({
          success: false,
          message: "Solo se pueden restaurar backups exitosos",
        });
      }

      if (!backup.file_path || !fs.existsSync(backup.file_path)) {
        return res.status(404).json({
          success: false,
          message: "Archivo de backup no encontrado",
        });
      }

      const userId = req.user?.userId || 0;
      const dbConfig = getDatabaseConnection();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Crear backup de seguridad antes de restaurar
      if (createBackupBefore) {
        try {
          const safetyBackupPath = path.join(
            path.dirname(backup.file_path),
            `safety_backup_before_restore_${timestamp}.sql${backup.compressed ? '.gz' : ''}`
          );
          
          // Verificar si es un backup comprimido
          if (backup.compressed) {
            // Para archivos comprimidos, solo copiamos el archivo actual
            fs.copyFileSync(backup.file_path, safetyBackupPath);
          } else {
            //mysqldump para crear backup de seguridad
            const safetyCmd = `mysqldump -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > ${safetyBackupPath}`;
            await execAsync(safetyCmd);
          }

          // Registrar el backup de seguridad
          await executeQuery({
            query: `
              INSERT INTO backup_logs 
              (backup_type, status, file_path, file_size, duration_seconds, created_by, description)
              VALUES ('safety', 'success', ?, ?, 0, ?, 'Backup de seguridad antes de restaurar')
            `,
            values: [safetyBackupPath, fs.statSync(safetyBackupPath).size, userId],
          });
        } catch (safetyError) {
          console.error("Error al crear backup de seguridad:", safetyError);
          // Continuamos con la restauración aunque falle el backup de seguridad
        }
      }

      // Registrar inicio de restauración
      const restoreLogId = await executeQuery({
        query: `
          INSERT INTO backup_logs 
          (backup_type, status, created_by, description)
          VALUES ('restore', 'in_progress', ?, 'Restauración iniciada')
        `,
        values: [userId],
      }) as any;

      try {
        // Determinar cómo restaurar según el tipo de archivo
        const filePath = backup.file_path;
        const isCompressed = backup.compressed === 1;
        const fileName = path.basename(filePath);
        
        let restoreCmd = '';
        
        // Si es un backup de base de datos
        if (backup.backup_type === 'database' || fileName.includes('backup_database') || fileName.includes('backup_full')) {
          if (isCompressed) {
            // Restaurar desde archivo comprimido
            restoreCmd = `gunzip < ${filePath} | mysql -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p${dbConfig.password}` : ''} ${dbConfig.database}`;
          } else {
            // Restaurar desde archivo sin comprimir
            restoreCmd = `mysql -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${dbConfig.password ? ` -p${dbConfig.password}` : ''} ${dbConfig.database} < ${filePath}`;
          }
        } else {
          // Para backups de archivos, extraer el tar
          const extractDir = path.join(process.cwd(), 'temp_restore_' + timestamp);
          fs.mkdirSync(extractDir, { recursive: true });
          
          if (isCompressed) {
            restoreCmd = `tar -xzf ${filePath} -C ${extractDir}`;
          } else {
            restoreCmd = `tar -xf ${filePath} -C ${extractDir}`;
          }
        }

        await execAsync(restoreCmd);

        // Actualizar registro de restauración
        await executeQuery({
          query: `
            UPDATE backup_logs 
            SET status = 'success', completed_at = NOW(), description = 'Restauración completada exitosamente'
            WHERE id = ?
          `,
          values: [restoreLogId.insertId],
        });

        return res.status(200).json({
          success: true,
          message: "Restauración completada exitosamente",
          backupId,
          safetyBackupCreated: createBackupBefore,
        });
      } catch (restoreError: any) {
        // Actualizar registro con error
        await executeQuery({
          query: `
            UPDATE backup_logs 
            SET status = 'failed', error_message = ?, completed_at = NOW(), description = 'Restauración fallida'
            WHERE id = ?
          `,
          values: [restoreError.message, restoreLogId.insertId],
        });

        return res.status(500).json({
          success: false,
          message: "Error al restaurar el backup",
          error: restoreError.message,
        });
      }
    } catch (error) {
      console.error("Error en el proceso de restauración:", error);
      return res.status(500).json({
        success: false,
        message: "Error en el proceso de restauración",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
