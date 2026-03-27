import { NextApiResponse } from "next";
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

      // Obtener información del backup
      const backupInfo = await executeQuery({
        query: "SELECT file_path, backup_type, created_at FROM backup_logs WHERE id = ? AND status = 'success'",
        values: [id],
      }) as any[];

      if (!backupInfo || backupInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Backup no encontrado",
        });
      }

      const backup = backupInfo[0];
      
      if (!backup.file_path || !fs.existsSync(backup.file_path)) {
        return res.status(404).json({
          success: false,
          message: "Archivo de backup no encontrado",
        });
      }

      // Determinar el tipo de contenido
      const fileName = path.basename(backup.file_path);
      const extension = path.extname(fileName).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (extension === '.gz') {
        contentType = 'application/gzip';
      } else if (extension === '.sql') {
        contentType = 'application/sql';
      } else if (extension === '.zip') {
        contentType = 'application/zip';
      } else if (extension === '.bz2') {
        contentType = 'application/x-bzip2';
      }

      // Leer el archivo
      const fileBuffer = fs.readFileSync(backup.file_path);
      
      // Configurar headers para la descarga
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Enviar el archivo
      return res.send(fileBuffer);
    } catch (error) {
      console.error("Error al descargar backup:", error);
      return res.status(500).json({
        success: false,
        message: "Error al descargar el backup",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
