import type { NextApiRequest, NextApiResponse } from "next";
import { testSftpConnection } from "@/lib/backupSftp";

interface SftpTestRequest {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
}

interface SftpTestResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SftpTestResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
      error: "Solo se permiten peticiones POST",
    });
  }

  try {
    const { host, port, username, password, remotePath } = req.body as SftpTestRequest;

    // Validar campos obligatorios
    if (!host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Campos incompletos",
        error: "Host, puerto, usuario y contraseña son obligatorios",
      });
    }

    // Validar rango de puerto
    if (port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: "Puerto inválido",
        error: "El puerto debe estar entre 1 y 65535",
      });
    }

    // Probar la conexión SFTP
    const result = await testSftpConnection({
      host,
      port,
      username,
      password,
      remotePath: remotePath || "/",
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Conexión exitosa",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Error de conexión",
        error: result.error || "No se pudo conectar al servidor SFTP",
      });
    }
  } catch (error: any) {
    console.error("Error en test SFTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
      error: error.message || "Error al probar la conexión",
    });
  }
}
