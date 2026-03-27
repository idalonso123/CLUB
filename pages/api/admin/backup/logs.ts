import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // GET: Obtener historial de backups
  if (req.method === "GET") {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      // Seleccionar solo las columnas esenciales que deberían existir
      let query = `
        SELECT 
          bl.id,
          bl.backup_type,
          bl.status,
          COALESCE(bl.file_path, '') as file_path,
          COALESCE(bl.file_size, 0) as file_size,
          COALESCE(bl.duration_seconds, 0) as duration_seconds,
          COALESCE(bl.error_message, '') as error_message,
          COALESCE(bl.checksum, '') as checksum,
          COALESCE(bl.compressed, 0) as compressed,
          COALESCE(bl.created_by, 0) as created_by,
          bl.created_at,
          bl.completed_at
        FROM backup_logs bl
        WHERE 1=1
      `;
      
      const values: any[] = [];
      
      if (type && type !== 'undefined' && type !== '') {
        query += " AND bl.backup_type = ?";
        values.push(type);
      }
      
      if (status && status !== 'undefined' && status !== '') {
        query += " AND bl.status = ?";
        values.push(status);
      }
      
      query += " ORDER BY bl.created_at DESC LIMIT ? OFFSET ?";
      values.push(limitNum, offset);
      
      let rows: any[] = [];
      try {
        rows = await executeQuery({
          query,
          values,
        }) as any[];
      } catch (queryError: any) {
        console.error("Error en consulta de logs:", queryError);
        // Si la tabla no existe, devolver vacío en lugar de error
        if (queryError.message?.includes('not exist') || queryError.message?.includes('ER_NO_SUCH_TABLE')) {
          rows = [];
        } else {
          throw queryError;
        }
      }
      
      // Obtener total para paginación
      let countQuery = "SELECT COUNT(*) as total FROM backup_logs WHERE 1=1";
      const countValues: any[] = [];
      
      if (type && type !== 'undefined' && type !== '') {
        countQuery += " AND backup_type = ?";
        countValues.push(type);
      }
      
      if (status && status !== 'undefined' && status !== '') {
        countQuery += " AND status = ?";
        countValues.push(status);
      }
      
      let total = 0;
      try {
        const countResult = await executeQuery({
          query: countQuery,
          values: countValues,
        }) as any[];
        total = countResult[0]?.total || 0;
      } catch (countError) {
        console.error("Error en consulta de conteo:", countError);
        total = 0;
      }
      
      // Obtener estadísticas
      let stats = {
        total: 0,
        successful: 0,
        failed: 0,
        in_progress: 0,
        total_size: 0,
      };
      
      try {
        const statsResult = await executeQuery({
          query: `
            SELECT 
              COUNT(*) as total,
              COALESCE(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 0) as successful,
              COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
              COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress,
              COALESCE(SUM(file_size), 0) as total_size
            FROM backup_logs
          `,
          values: [],
        }) as any[];
        
        if (statsResult && statsResult[0]) {
          stats = statsResult[0];
        }
      } catch (statsError) {
        console.error("Error en consulta de estadísticas:", statsError);
        // Mantener stats con valores por defecto
      }

      // Formatear datos
      const logs = rows.map((row: any) => ({
        id: row.id,
        type: row.backup_type || 'unknown',
        status: row.status || 'unknown',
        filePath: row.file_path || null,
        size: row.file_size || 0,
        sizeFormatted: formatBytes(row.file_size || 0),
        duration: formatDuration(row.duration_seconds),
        errorMessage: row.error_message || null,
        checksum: row.checksum || null,
        compressed: row.compressed === 1,
        encrypted: false, // Valor por defecto si no existe la columna
        tablesCount: 0, // Valor por defecto si no existe la columna
        recordsCount: 0, // Valor por defecto si no existe la columna
        createdBy: row.created_by || null,
        createdByName: row.created_by ? `Usuario ${row.created_by}` : 'Sistema',
        createdAt: row.created_at || new Date().toISOString(),
        completedAt: row.completed_at || null,
      }));

      return res.status(200).json({
        success: true,
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 0,
        },
        stats: {
          total: stats.total || 0,
          successful: stats.successful || 0,
          failed: stats.failed || 0,
          inProgress: stats.in_progress || 0,
          totalSize: stats.total_size || 0,
          totalSizeFormatted: formatBytes(stats.total_size || 0),
        },
      });
    } catch (error) {
      console.error("Error al obtener historial de backups:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el historial de backups",
        error: (error as Error).message,
      });
    }
  }

  // DELETE: Eliminar backup específico
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup a eliminar",
        });
      }

      // Obtener información del backup
      const backupInfo = await executeQuery({
        query: "SELECT file_path FROM backup_logs WHERE id = ?",
        values: [id],
      }) as any[];

      if (!backupInfo || backupInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Backup no encontrado",
        });
      }

      // Eliminar archivo físico si existe
      const filePath = backupInfo[0].file_path;
      if (filePath) {
        try {
          const fs = require('fs');
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error("Error al eliminar archivo de backup:", fileError);
        }
      }

      // Eliminar registro de la base de datos
      await executeQuery({
        query: "DELETE FROM backup_logs WHERE id = ?",
        values: [id],
      });

      return res.status(200).json({
        success: true,
        message: "Backup eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar backup:", error);
      return res.status(500).json({
        success: false,
        message: "Error al eliminar el backup",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default withAuth(handler);
