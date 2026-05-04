import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import fs from "fs";
import path from "path";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // GET: Descargar backup
  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup",
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
            "SELECT id, file_path, backup_type, status, file_size, checksum, compressed, created_at FROM backup_logs WHERE id = ? AND status = 'success'",
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
          message: "Backup no encontrado o no está disponible para descarga",
        });
      }

      const backup = backupInfo[0];

      if (!backup.file_path) {
        return res.status(404).json({
          success: false,
          message: "El backup no tiene una ruta de archivo asociada",
        });
      }

      if (!fs.existsSync(backup.file_path)) {
        return res.status(404).json({
          success: false,
          message: "Archivo de backup no encontrado en el sistema de archivos",
          filePath: backup.file_path,
        });
      }

      // Determinar el tipo de contenido según la extensión
      const fileName = path.basename(backup.file_path);
      const extension = path.extname(fileName).toLowerCase();

      let contentType = "application/octet-stream";
      if (extension === ".gz") {
        contentType = backup.backup_type === "database" ? "application/gzip" : "application/gzip";
      } else if (extension === ".sql") {
        contentType = "application/sql";
      } else if (extension === ".zip") {
        contentType = "application/zip";
      } else if (extension === ".bz2") {
        contentType = "application/x-bzip2";
      } else if (extension === ".tar") {
        contentType = "application/x-tar";
      }

      // Leer el archivo
      const fileBuffer = fs.readFileSync(backup.file_path);

      // Configurar headers para la descarga
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", fileBuffer.length);

      // Headers adicionales de seguridad y cache
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");

      // Enviar el archivo
      return res.send(fileBuffer);
    } catch (error: any) {
      console.error("Error al descargar backup:", error);

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
        message: "Error al descargar el backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  // HEAD: Verificar si un backup existe (útil para validar antes de descargar)
  if (req.method === "HEAD") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup",
        });
      }

      const backupId = parseInt(id as string, 10);
      if (isNaN(backupId)) {
        return res.status(400).json({
          success: false,
          message: "ID de backup inválido",
        });
      }

      let backupInfo: any[] = [];
      try {
        backupInfo = (await executeQuery({
          query:
            "SELECT id, file_path, backup_type, status, file_size FROM backup_logs WHERE id = ?",
          values: [backupId],
        })) as any[];
      } catch (queryError: any) {
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
      const fileExists =
        backup.file_path && fs.existsSync(backup.file_path);

      res.setHeader("X-Backup-Exists", fileExists ? "true" : "false");
      res.setHeader("X-Backup-Status", backup.status);
      res.setHeader("X-Backup-Type", backup.backup_type);
      res.setHeader("X-Backup-Size", backup.file_size || 0);

      return res.status(200).json({
        success: true,
        exists: fileExists,
        status: backup.status,
        type: backup.backup_type,
        size: backup.file_size || 0,
      });
    } catch (error: any) {
      console.error("Error al verificar backup:", error);

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
        message: "Error al verificar el backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
