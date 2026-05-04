import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import fs from "fs";
import path from "path";

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // GET: Obtener historial de backups
  if (req.method === "GET") {
    try {
      const { page = "1", limit = "20", type, status } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const offset = (pageNum - 1) * limitNum;

      // Construir consulta con todas las columnas del esquema
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
          COALESCE(bl.encrypted, 0) as encrypted,
          COALESCE(bl.tables_count, 0) as tables_count,
          COALESCE(bl.records_count, 0) as records_count,
          COALESCE(bl.created_by, 0) as created_by,
          bl.created_at,
          bl.completed_at
        FROM backup_logs bl
        WHERE 1=1
      `;

      const values: any[] = [];

      if (type && type !== "undefined" && type !== "") {
        query += " AND bl.backup_type = ?";
        values.push(type);
      }

      if (status && status !== "undefined" && status !== "") {
        query += " AND bl.status = ?";
        values.push(status);
      }

      query += " ORDER BY bl.created_at DESC LIMIT ? OFFSET ?";
      values.push(limitNum, offset);

      let rows: any[] = [];
      try {
        rows = (await executeQuery({
          query,
          values,
        })) as any[];
      } catch (queryError: any) {
        console.error("Error en consulta de logs:", queryError);
        if (
          queryError.message?.includes("not exist") ||
          queryError.code === "ER_NO_SUCH_TABLE"
        ) {
          return res.status(500).json({
            success: false,
            message:
              "La tabla de logs de backup no existe. Ejecuta el script SQL de creación de tablas.",
            error: "Tabla no encontrada",
            code: "TABLE_NOT_EXISTS",
          });
        }
        throw queryError;
      }

      // Obtener total para paginación
      let countQuery = "SELECT COUNT(*) as total FROM backup_logs WHERE 1=1";
      const countValues: any[] = [];

      if (type && type !== "undefined" && type !== "") {
        countQuery += " AND backup_type = ?";
        countValues.push(type);
      }

      if (status && status !== "undefined" && status !== "") {
        countQuery += " AND status = ?";
        countValues.push(status);
      }

      let total = 0;
      try {
        const countResult = (await executeQuery({
          query: countQuery,
          values: countValues,
        })) as any[];
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
        const statsResult = (await executeQuery({
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
        })) as any[];

        if (statsResult && statsResult[0]) {
          stats = statsResult[0];
        }
      } catch (statsError) {
        console.error("Error en consulta de estadísticas:", statsError);
      }

      // Formatear datos correctamente
      const logs = rows.map((row: any) => ({
        id: row.id,
        type: row.backup_type || "unknown",
        status: row.status || "unknown",
        filePath: row.file_path || null,
        size: row.file_size || 0,
        sizeFormatted: formatBytes(row.file_size),
        duration: formatDuration(row.duration_seconds),
        durationSeconds: row.duration_seconds || 0,
        errorMessage: row.error_message || null,
        checksum: row.checksum || null,
        compressed: row.compressed === 1,
        encrypted: row.encrypted === 1,
        tablesCount: row.tables_count || 0,
        recordsCount: row.records_count || 0,
        createdBy: row.created_by || null,
        createdByName: row.created_by ? `Usuario ${row.created_by}` : "Sistema",
        createdAt: row.created_at || new Date().toISOString(),
        completedAt: row.completed_at || null,
      }));

      return res.status(200).json({
        success: true,
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limitNum) || 0,
        },
        stats: {
          total: stats.total || 0,
          successful: stats.successful || 0,
          failed: stats.failed || 0,
          inProgress: stats.in_progress || 0,
          totalSize: stats.total_size || 0,
          totalSizeFormatted: formatBytes(stats.total_size),
        },
      });
    } catch (error: any) {
      console.error("Error al obtener historial de backups:", error);

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
        message: "Error al obtener el historial de backups",
        error: error.message || "Error desconocido",
      });
    }
  }

  // DELETE: Eliminar backup específico
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup a eliminar",
        });
      }

      const backupId = parseInt(id as string, 10);
      if (isNaN(backupId)) {
        return res.status(400).json({
          success: false,
          message: "ID de backup inválido",
        });
      }

      // Obtener información del backup
      let backupInfo: any[] = [];
      try {
        backupInfo = (await executeQuery({
          query:
            "SELECT id, file_path, backup_type, status FROM backup_logs WHERE id = ?",
          values: [backupId],
        })) as any[];
      } catch (queryError: any) {
        console.error("Error al buscar backup:", queryError);
        if (
          queryError.message?.includes("not exist") ||
          queryError.code === "ER_NO_SUCH_TABLE"
        ) {
          return res.status(500).json({
            success: false,
            message:
              "La tabla de logs de backup no existe. Ejecuta el script SQL de creación de tablas.",
            error: "Tabla no encontrada",
            code: "TABLE_NOT_EXISTS",
          });
        }
        throw queryError;
      }

      if (!backupInfo || backupInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Backup no encontrado",
        });
      }

      const backup = backupInfo[0];
      let fileDeleted = false;
      let fileError = null;

      // Eliminar archivo físico si existe
      if (backup.file_path && backup.backup_type !== "cleanup") {
        try {
          if (fs.existsSync(backup.file_path)) {
            fs.unlinkSync(backup.file_path);
            fileDeleted = true;
          }
        } catch (fileError: any) {
          console.error("Error al eliminar archivo de backup:", fileError);
          fileError = fileError.message;
        }
      }

      // Eliminar registro de la base de datos
      try {
        await executeQuery({
          query: "DELETE FROM backup_logs WHERE id = ?",
          values: [backupId],
        });
      } catch (deleteError: any) {
        console.error("Error al eliminar registro:", deleteError);
        return res.status(500).json({
          success: false,
          message: "Error al eliminar el backup de la base de datos",
          error: deleteError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Backup eliminado correctamente",
        details: {
          id: backupId,
          type: backup.backup_type,
          fileDeleted,
          fileError,
        },
      });
    } catch (error: any) {
      console.error("Error al eliminar backup:", error);

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
        message: "Error al eliminar el backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  // POST: Crear nuevo registro de backup (para uso interno)
  if (req.method === "POST") {
    try {
      const {
        backupType,
        status = "in_progress",
        filePath = null,
        fileSize = 0,
        durationSeconds = 0,
        errorMessage = null,
        checksum = null,
        compressed = false,
        encrypted = false,
        tablesCount = 0,
        recordsCount = 0,
      } = req.body;

      // Validar tipo de backup
      const validTypes = ["database", "files", "full", "cleanup", "restore"];
      if (!backupType || !validTypes.includes(backupType)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de backup inválido. Valores válidos: ${validTypes.join(", ")}`,
        });
      }

      // Validar estado
      const validStatuses = ["in_progress", "success", "failed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Valores válidos: ${validStatuses.join(", ")}`,
        });
      }

      const userId = req.user?.userId || null;

      const result = (await executeQuery({
        query: `
          INSERT INTO backup_logs 
          (backup_type, status, file_path, file_size, duration_seconds, 
           error_message, checksum, compressed, encrypted, tables_count, 
           records_count, created_by, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                  CASE WHEN ? = 'success' THEN CURRENT_TIMESTAMP ELSE NULL END)
        `,
        values: [
          backupType,
          status,
          filePath,
          fileSize,
          durationSeconds,
          errorMessage,
          checksum,
          compressed ? 1 : 0,
          encrypted ? 1 : 0,
          tablesCount,
          recordsCount,
          userId,
          status,
        ],
      })) as any;

      return res.status(201).json({
        success: true,
        message: "Registro de backup creado correctamente",
        id: result.insertId,
      });
    } catch (error: any) {
      console.error("Error al crear registro de backup:", error);

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
        message: "Error al crear el registro de backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
