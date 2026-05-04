import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { verifyFileIntegrity, calculateChecksum, isValidChecksumFormat } from "@/lib/backupIntegrity";
import fs from "fs";

interface IntegrityVerificationResponse {
  success: boolean;
  message: string;
  backupId?: number;
  filePath?: string;
  fileExists?: boolean;
  checksumStored?: string;
  checksumCurrent?: string;
  isValid?: boolean | null;
  algorithm?: string;
  error?: string;
  verifiedAt?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<IntegrityVerificationResponse>
) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No autorizado",
      error: "Se requiere rol de administrador",
    });
  }

  // GET: Verificar integridad de un backup
  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup",
          error: "ID no proporcionado",
        });
      }

      const backupIdNum = parseInt(id as string, 10);
      if (isNaN(backupIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de backup inválido",
          error: "ID debe ser un número",
        });
      }

      // Obtener información del backup
      let backupInfo: any[] = [];
      try {
        backupInfo = (await executeQuery({
          query: `
            SELECT 
              id, backup_type, status, file_path, checksum, encrypted, 
              compressed, file_size, created_at
            FROM backup_logs 
            WHERE id = ? AND backup_type != 'restore'
          `,
          values: [backupIdNum],
        })) as any[];
      } catch (queryError: any) {
        if (
          queryError.message?.includes("not exist") ||
          queryError.code === "ER_NO_SUCH_TABLE"
        ) {
          return res.status(500).json({
            success: false,
            message: "La tabla de logs de backup no existe",
            error: "Tabla no encontrada",
          });
        }
        throw queryError;
      }

      if (!backupInfo || backupInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Backup no encontrado",
          error: "No existe un backup con ese ID",
        });
      }

      const backup = backupInfo[0];

      // Verificar que el backup tiene checksum registrado
      if (!backup.checksum || !isValidChecksumFormat(backup.checksum)) {
        return res.status(400).json({
          success: false,
          message: "El backup no tiene un checksum válido registrado",
          error: "Checksum no disponible",
          backupId: backupIdNum,
        });
      }

      // Verificar que el archivo existe
      const fileExists = backup.file_path && fs.existsSync(backup.file_path);
      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: "Archivo de backup no encontrado",
          error: "El archivo no existe en el sistema de archivos",
          backupId: backupIdNum,
          filePath: backup.file_path,
          fileExists: false,
        });
      }

      // Si el archivo está cifrado, no se puede verificar
      if (backup.encrypted === 1) {
        return res.status(200).json({
          success: true,
          message: "El backup está cifrado. La verificación de integridad no está disponible para archivos cifrados sin descifrar.",
          backupId: backupIdNum,
          filePath: backup.file_path,
          fileExists: true,
          checksumStored: backup.checksum,
          isValid: null,
          algorithm: "SHA-256",
          verifiedAt: new Date().toISOString(),
        });
      }

      // Verificar integridad del archivo
      const verificationResult = verifyFileIntegrity(backup.file_path, backup.checksum);

      if (verificationResult.success) {
        // Registrar la verificación en la base de datos
        try {
          await executeQuery({
            query: `
              INSERT INTO backup_logs 
              (backup_type, status, file_path, file_size, duration_seconds, 
               created_by, completed_at, error_message, checksum)
              VALUES ('integrity_check', 'success', ?, ?, 0, ?, NOW(), ?, ?)
            `,
            values: [
              backup.file_path,
              backup.file_size,
              req.user?.userId || 0,
              verificationResult.isValid 
                ? "Integridad verificada: OK" 
                : "⚠️ ALERTA: Integridad comprometida",
              backup.checksum,
            ],
          });
        } catch (logError) {
          console.error("Error al registrar verificación:", logError);
          // No fallamos la petición por un error de log
        }

        return res.status(200).json({
          success: true,
          message: verificationResult.isValid
            ? "Integridad del backup verificada correctamente"
            : "⚠️ ALERTA: El checksum no coincide. El archivo puede haber sido alterado o está corrupto.",
          backupId: backupIdNum,
          filePath: backup.file_path,
          fileExists: true,
          checksumStored: verificationResult.originalChecksum,
          checksumCurrent: verificationResult.currentChecksum,
          isValid: verificationResult.isValid,
          algorithm: verificationResult.algorithm,
          verifiedAt: new Date().toISOString(),
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Error al verificar la integridad del backup",
          error: verificationResult.error,
          backupId: backupIdNum,
          checksumStored: backup.checksum,
        });
      }
    } catch (error: any) {
      console.error("Error en verificación de integridad:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al verificar integridad",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: "Método no permitido",
    error: "Solo se permiten peticiones GET",
  });
}

export default withAuth(handler);
