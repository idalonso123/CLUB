/**
 * Módulo de utilidades para transferencia de archivos via SFTP
 * Permite subir backups a servidores remotos via SFTP/SSH
 */

import Client from "ssh2-sftp-client";

/**
 * Configuración de conexión SFTP
 */
export interface SftpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
  passiveMode?: boolean;
}

/**
 * Resultado de operación SFTP
 */
export interface SftpResult {
  success: boolean;
  uploadedPath?: string;
  uploadedSize?: number;
  error?: string;
}

/**
 * Información de conexión SFTP
 */
export interface SftpConnectionInfo {
  host: string;
  port: number;
  username: string;
  connected: boolean;
  remotePath: string;
}

/**
 * Conecta a un servidor SFTP y devuelve información de la conexión
 * @param config - Configuración de conexión SFTP
 * @returns Información de la conexión
 */
export async function connectSftp(config: SftpConfig): Promise<SftpConnectionInfo> {
  const sftp = new Client();
  
  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 20000,
    });

    const info = await sftp.list(config.remotePath);
    
    return {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      connected: true,
      remotePath: config.remotePath,
    };
  } catch (error: any) {
    return {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      connected: false,
      remotePath: config.remotePath,
    };
  } finally {
    sftp.end();
  }
}

/**
 * Sube un archivo a un servidor SFTP
 * @param localPath - Ruta local del archivo a subir
 * @param config - Configuración de conexión SFTP
 * @returns Resultado de la operación
 */
export async function uploadFileToSftp(
  localPath: string,
  config: SftpConfig
): Promise<SftpResult> {
  const sftp = new Client();
  const fs = require("fs");
  const path = require("path");

  try {
    // Verificar que el archivo local existe
    if (!fs.existsSync(localPath)) {
      return {
        success: false,
        error: "El archivo local no existe",
      };
    }

    const fileStats = fs.statSync(localPath);
    const fileName = path.basename(localPath);
    const remoteFilePath = `${config.remotePath}/${fileName}`.replace(/\/+/g, "/");

    // Conectar al servidor SFTP
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 30000,
    });

    // Asegurarse de que el directorio remoto existe
    const remoteDir = config.remotePath;
    const dirExists = await sftp.exists(remoteDir);
    
    if (!dirExists) {
      // Crear directorio remoto si no existe
      await sftp.mkdir(remoteDir, true);
    }

    // Subir el archivo
    await sftp.put(localPath, remoteFilePath);

    return {
      success: true,
      uploadedPath: remoteFilePath,
      uploadedSize: fileStats.size,
    };
  } catch (error: any) {
    let errorMessage = error.message || "Error desconocido al subir archivo";

    // Manejar errores específicos
    if (error.message?.includes("ECONNREFUSED")) {
      errorMessage = "Conexión rechazada. Verifique el host y puerto.";
    } else if (error.message?.includes("ETIMEDOUT")) {
      errorMessage = "Tiempo de conexión agotado. Verifique la red.";
    } else if (error.message?.includes("authentication")) {
      errorMessage = "Error de autenticación. Verifique usuario y contraseña.";
    } else if (error.message?.includes("ENOTFOUND")) {
      errorMessage = "Host no encontrado. Verifique la dirección del servidor.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    sftp.end();
  }
}

/**
 * Lista archivos en un directorio remoto SFTP
 * @param config - Configuración de conexión SFTP
 * @param remotePath - Ruta remota a listar (opcional, usa la de config)
 * @returns Lista de archivos
 */
export async function listRemoteFiles(
  config: SftpConfig,
  remotePath?: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 20000,
    });

    const listPath = remotePath || config.remotePath;
    const files = await sftp.list(listPath);

    return {
      success: true,
      files: files.map((f: any) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        modifyTime: f.modifyTime,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al listar archivos",
    };
  } finally {
    sftp.end();
  }
}

/**
 * Elimina un archivo en un servidor SFTP
 * @param remotePath - Ruta completa del archivo a eliminar
 * @param config - Configuración de conexión SFTP
 * @returns Resultado de la operación
 */
export async function deleteRemoteFile(
  remotePath: string,
  config: SftpConfig
): Promise<{ success: boolean; error?: string }> {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 20000,
    });

    await sftp.delete(remotePath);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar archivo",
    };
  } finally {
    sftp.end();
  }
}

/**
 * Verifica si la conexión SFTP funciona correctamente
 * @param config - Configuración de conexión SFTP
 * @returns true si la conexión es exitosa
 */
export async function testSftpConnection(config: SftpConfig): Promise<{ success: boolean; error?: string }> {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 10000,
    });

    // Verificar que el directorio remoto existe o se puede crear
    const dirExists = await sftp.exists(config.remotePath);
    if (!dirExists) {
      await sftp.mkdir(config.remotePath, true);
    }

    sftp.end();

    return {
      success: true,
    };
  } catch (error: any) {
    sftp.end();
    
    let errorMessage = error.message || "Error de conexión";

    if (error.message?.includes("ECONNREFUSED")) {
      errorMessage = "Conexión rechazada. Puerto o firewall.";
    } else if (error.message?.includes("ENOTFOUND")) {
      errorMessage = "Servidor no encontrado. Verifique el host.";
    } else if (error.message?.includes("authentication")) {
      errorMessage = "Autenticación fallida. Usuario o contraseña incorrectos.";
    } else if (error.message?.includes("ETIMEDOUT")) {
      errorMessage = "Tiempo de conexión agotado.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Descarga un archivo desde un servidor SFTP
 * @param remotePath - Ruta remota del archivo
 * @param localPath - Ruta local donde guardar
 * @param config - Configuración de conexión SFTP
 * @returns Resultado de la operación
 */
export async function downloadFileFromSftp(
  remotePath: string,
  localPath: string,
  config: SftpConfig
): Promise<{ success: boolean; localPath?: string; error?: string }> {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 30000,
    });

    await sftp.get(remotePath, localPath);

    return {
      success: true,
      localPath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al descargar archivo",
    };
  } finally {
    sftp.end();
  }
}

export default {
  connectSftp,
  uploadFileToSftp,
  listRemoteFiles,
  deleteRemoteFile,
  testSftpConnection,
  downloadFileFromSftp,
};