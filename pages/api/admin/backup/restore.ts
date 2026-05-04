import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { decryptFile, isFileEncrypted } from "@/lib/backupEncryption";
import { verifyFileIntegrity, calculateChecksum, isValidChecksumFormat } from "@/lib/backupIntegrity";

const execAsync = promisify(exec);

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDatabaseConnection(): DatabaseConfig {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "Club ViveVerde",
  };
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

  // POST: Restaurar backup
  if (req.method === "POST") {
    try {
      const { backupId, createBackupBefore = true } = req.body;

      if (!backupId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup a restaurar",
        });
      }

      const backupIdNum = parseInt(backupId, 10);
      if (isNaN(backupIdNum)) {
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
            "SELECT id, backup_type, status, file_path, file_size, checksum, compressed, encrypted, created_at FROM backup_logs WHERE id = ?",
          values: [backupIdNum],
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

      if (backup.status !== "success") {
        return res.status(400).json({
          success: false,
          message: "Solo se pueden restaurar backups exitosos",
        });
      }

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

      const userId = req.user?.userId || 0;
      
      // ========================================
      // VERIFICACIÓN DE INTEGRIDAD (IMPLEMENTACIÓN 6)
      // Verificar checksum SHA-256 antes de restaurar
      // ========================================
      let integrityCheckPassed = true;
      let integrityWarning = null;
      
      if (backup.checksum && isValidChecksumFormat(backup.checksum) && !backup.encrypted) {
        console.log(`Verificando integridad del backup antes de restaurar...`);
        console.log(`Checksum almacenado: ${backup.checksum}`);
        
        const integrityResult = verifyFileIntegrity(backup.file_path, backup.checksum);
        
        if (integrityResult.success) {
          if (!integrityResult.isValid) {
            console.error(`⚠️ ALERTA DE SEGURIDAD: Checksum no coincide!`);
            console.error(`Checksum original: ${integrityResult.originalChecksum}`);
            console.error(`Checksum actual: ${integrityResult.currentChecksum}`);
            
            integrityCheckPassed = false;
            integrityWarning = `⚠️ ALERTA: La verificación de integridad ha fallado. El checksum del archivo (${integrityResult.currentChecksum}) no coincide con el registrado (${integrityResult.originalChecksum}). El archivo puede haber sido alterado o está corrupto.`;
            
            // Registrar el intento de restauración de backup comprometido
            try {
              await executeQuery({
                query: `
                  INSERT INTO backup_logs 
                  (backup_type, status, file_path, file_size, duration_seconds, 
                   created_by, completed_at, error_message, checksum)
                  VALUES ('restore', 'failed', ?, ?, 0, ?, NOW(), ?)
                `,
                values: [
                  backup.file_path,
                  backup.file_size,
                  userId || 0,
                  `ALERTA SEGURIDAD: Restauración bloqueada - Checksum no coincide. Original: ${integrityResult.originalChecksum}, Actual: ${integrityResult.currentChecksum}`,
                  backup.checksum,
                ],
              });
            } catch (logError) {
              console.error("Error al registrar alerta de seguridad:", logError);
            }
            
            return res.status(400).json({
              success: false,
              message: "Restauración bloqueada por verificación de integridad fallida",
              error: integrityWarning,
              errorCode: "INTEGRITY_CHECK_FAILED",
              backupId: backupIdNum,
              integrityDetails: {
                algorithm: integrityResult.algorithm,
                storedChecksum: integrityResult.originalChecksum,
                currentChecksum: integrityResult.currentChecksum,
                isValid: false,
              },
            });
          } else {
            console.log(`✓ Verificación de integridad exitosa: ${integrityResult.currentChecksum}`);
          }
        } else {
          console.warn(`No se pudo verificar la integridad: ${integrityResult.error}`);
          integrityWarning = `No se pudo verificar la integridad: ${integrityResult.error}`;
        }
      } else if (backup.encrypted) {
        console.log(`Backup cifrado - La verificación de integridad se realizará después del descifrado`);
      }
      // ========================================
      // FIN VERIFICACIÓN DE INTEGRIDAD
      // ========================================
      
      const dbConfig = getDatabaseConnection();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const isWindows = os.platform() === "win32";

      let safetyBackupCreated = false;
      let safetyBackupPath = null;

      // Variables para el proceso de restauración
      let filePath = "";
      let isEncrypted = false;
      let workingFilePath = "";

      // Crear backup de seguridad antes de restaurar
      if (createBackupBefore) {
        try {
          const safetyFileName = `safety_backup_before_restore_${timestamp}.sql${
            backup.compressed ? ".gz" : ""
          }`;
          safetyBackupPath = path.join(
            path.dirname(backup.file_path),
            safetyFileName
          );

          if (backup.compressed) {
            fs.copyFileSync(backup.file_path, safetyBackupPath);
          } else {
            const escapedPassword = dbConfig.password.replace(/`/g, "\\`");
            const safetyCmd = `mysqldump --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${
              dbConfig.password ? ` -p'${escapedPassword}'` : ""
            } ${dbConfig.database} > "${safetyBackupPath}"`;
            await execAsync(safetyCmd);
          }

          const safetyStats = fs.statSync(safetyBackupPath);

          await executeQuery({
            query: `
              INSERT INTO backup_logs 
              (backup_type, status, file_path, file_size, duration_seconds, 
               created_by, completed_at, error_message)
              VALUES ('restore', 'success', ?, ?, 0, ?, NOW(), 'Backup de seguridad antes de restaurar')
            `,
            values: [safetyBackupPath, safetyStats.size, userId],
          });

          safetyBackupCreated = true;
        } catch (safetyError: any) {
          console.error(
            "Error al crear backup de seguridad:",
            safetyError
          );
        }
      }

      // Registrar inicio de restauración
      let restoreLogId: number;
      try {
        const restoreResult = (await executeQuery({
          query: `
            INSERT INTO backup_logs 
            (backup_type, status, created_by, error_message)
            VALUES ('restore', 'in_progress', ?, 'Restauración iniciada')
          `,
          values: [userId],
        })) as any;

        restoreLogId = restoreResult.insertId;
      } catch (insertError: any) {
        console.error("Error al crear registro de restauración:", insertError);
        return res.status(500).json({
          success: false,
          message: "Error al crear el registro de restauración",
          error: insertError.message,
        });
      }

      try {
        // Inicializar variables del proceso
        filePath = backup.file_path;
        const isCompressed = backup.compressed === 1;
        isEncrypted = backup.encrypted === 1;
        const fileName = path.basename(filePath);

        // Si el archivo está cifrado, solicitar contraseña y descifrarlo primero
        workingFilePath = filePath;
        if (isEncrypted) {
          // Verificar si se proporcionó contraseña
          const { decryptionPassword } = req.body;
          if (!decryptionPassword) {
            return res.status(400).json({
              success: false,
              message: "El backup está cifrado. Se requiere la contraseña de descifrado.",
              error: "ENCRYPTED_BACKUP_REQUIRES_PASSWORD",
              requiresDecryptionPassword: true,
            });
          }

          // Crear directorio temporal para el archivo descifrado
          const tempDir = path.join(os.tmpdir(), `decrypt_${timestamp}`);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const decryptedFilePath = path.join(tempDir, `decrypted_${fileName.replace('.enc', '')}`);
          const decryptResult = await decryptFile(filePath, decryptedFilePath, decryptionPassword);

          if (!decryptResult.success) {
            // Limpiar directorio temporal
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            return res.status(400).json({
              success: false,
              message: decryptResult.error || "Error al descifrar el backup",
              error: "DECRYPTION_FAILED",
            });
          }

          workingFilePath = decryptedFilePath;
          console.log(`Backup descifrado exitosamente: ${decryptedFilePath}`);
          
          // ========================================
          // VERIFICACIÓN POST-DESCIFRADO (IMPLEMENTACIÓN 6)
          // Verificar integridad del archivo descifrado
          // ========================================
          if (backup.checksum && isValidChecksumFormat(backup.checksum)) {
            console.log(`Verificando integridad del backup descifrado...`);
            
            const integrityResult = verifyFileIntegrity(decryptedFilePath, backup.checksum);
            
            if (integrityResult.success) {
              if (!integrityResult.isValid) {
                console.error(`⚠️ ALERTA DE SEGURIDAD: Checksum no coincide después del descifrado!`);
                
                // Limpiar directorio temporal
                const tempDir = path.dirname(decryptedFilePath);
                fs.rmSync(tempDir, { recursive: true, force: true });
                
                return res.status(400).json({
                  success: false,
                  message: "Restauración bloqueada por verificación de integridad fallida después del descifrado",
                  error: `⚠️ ALERTA: La verificación de integridad ha fallado después del descifrado. El checksum del archivo descifrado (${integrityResult.currentChecksum}) no coincide con el registrado (${integrityResult.originalChecksum}).`,
                  errorCode: "INTEGRITY_CHECK_FAILED_POST_DECRYPT",
                  backupId: backupIdNum,
                  wasEncrypted: true,
                  integrityDetails: {
                    algorithm: integrityResult.algorithm,
                    storedChecksum: integrityResult.originalChecksum,
                    currentChecksum: integrityResult.currentChecksum,
                    isValid: false,
                  },
                });
              } else {
                console.log(`✓ Verificación de integridad post-descifrado exitosa: ${integrityResult.currentChecksum}`);
              }
            }
          }
          // ========================================
          // FIN VERIFICACIÓN POST-DESCIFRADO
          // ========================================
        }

        const isDatabaseBackup =
          backup.backup_type === "database" ||
          fileName.includes("backup_database") ||
          fileName.includes("backup_full") ||
          fileName.includes("backup_db") ||
          fileName.includes(".sql");

        const escapedPassword = dbConfig.password.replace(/`/g, "\\`");
        const appRootDir = process.cwd();

        // Si es un backup de base de datos
        if (isDatabaseBackup) {
          let restoreCmd = "";

          if (isCompressed && !isEncrypted) {
            restoreCmd = `gunzip < "${workingFilePath}" | mysql --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${
              dbConfig.password ? ` -p'${escapedPassword}'` : ""
            } ${dbConfig.database}`;
          } else {
            restoreCmd = `mysql --default-auth=mysql_native_password -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.user}${
              dbConfig.password ? ` -p'${escapedPassword}'` : ""
            } ${dbConfig.database} < "${workingFilePath}"`;
          }

          await execAsync(restoreCmd);

          // Limpiar archivo temporal descifrado si existe
          if (isEncrypted && workingFilePath !== filePath) {
            try {
              const tempDir = path.dirname(workingFilePath);
              fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (cleanupError) {
              console.error("Error al limpiar archivos temporales:", cleanupError);
            }
          }

          // Actualizar registro de restauración a exitoso
          await executeQuery({
            query: `
              UPDATE backup_logs 
              SET status = 'success', completed_at = NOW(), error_message = 'Restauración de base de datos completada exitosamente'
              WHERE id = ?
            `,
            values: [restoreLogId],
          });

          return res.status(200).json({
            success: true,
            message: "Restauración de base de datos completada exitosamente",
            backupId: backupIdNum,
            backupType: backup.backup_type,
            safetyBackupCreated,
            safetyBackupPath,
            wasEncrypted: isEncrypted,
          });
        } else {
          // Para backups de archivos (aplicación)
          const tempDir = path.join(os.tmpdir(), `restore_${timestamp}`);
          const extractFilePath = workingFilePath;

          // Crear directorio temporal para extracción
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
          fs.mkdirSync(tempDir, { recursive: true });

          // Extraer el archivo de backup
          let extractCmd = "";
          if (extractFilePath.endsWith(".zip")) {
            if (isWindows) {
              extractCmd = `powershell -Command "Expand-Archive -Path '${extractFilePath}' -DestinationPath '${tempDir}' -Force"`;
            } else {
              extractCmd = `unzip -o "${extractFilePath}" -d "${tempDir}"`;
            }
          } else if (isCompressed && !isEncrypted) {
            extractCmd = `tar -xzf "${extractFilePath}" -C "${tempDir}"`;
          } else {
            extractCmd = `tar -xf "${extractFilePath}" -C "${tempDir}"`;
          }

          console.log("Extrayendo archivos de backup...");
          await execAsync(extractCmd);

          // Verificar que la extracción fue exitosa
          const extractedFiles = fs.readdirSync(tempDir);
          if (extractedFiles.length === 0) {
            throw new Error("No se pudieron extraer los archivos del backup");
          }

          // Mover archivos extraídos a la carpeta de la aplicación
          console.log("Moviendo archivos a la carpeta de la aplicación...");

          // Los archivos pueden estar en una subcarpeta ( según tar) o directamente
          let sourceDir = tempDir;
          const firstItem = path.join(tempDir, extractedFiles[0]);
          if (extractedFiles.length === 1 && fs.statSync(firstItem).isDirectory()) {
            // Los archivos están dentro de una subcarpeta
            sourceDir = firstItem;
          }

          // Copiar todos los archivos a la carpeta de la aplicación
          await copyDirectoryContents(sourceDir, appRootDir);

          // Verificar si existe package.json
          const packageJsonPath = path.join(appRootDir, "package.json");
          let npmInstallNeeded = false;
          let npmInstallRequired = false;

          if (fs.existsSync(packageJsonPath)) {
            npmInstallNeeded = true;

            // Verificar si node_modules existe
            const nodeModulesPath = path.join(appRootDir, "node_modules");
            if (!fs.existsSync(nodeModulesPath)) {
              npmInstallRequired = true;
            }
          }

          // Limpiar directorio temporal
          fs.rmSync(tempDir, { recursive: true, force: true });

          // Ejecutar npm install si es necesario
          if (npmInstallRequired) {
            console.log("Ejecutando npm install (esto puede tardar varios minutos)...");

            // Intentar primero con npm ci (más rápido y exacto)
            let npmCmd = `cd "${appRootDir}" && npm ci --legacy-peer-deps`;

            try {
              // Verificar si npm ci está disponible
              await execAsync(`npm ci --version`);
            } catch {
              // Si npm ci falla, usar npm install
              npmCmd = `cd "${appRootDir}" && npm install --legacy-peer-deps`;
            }

            try {
              // Configurar timeout más largo para npm install
              const { stdout, stderr } = await execAsync(npmCmd, {
                maxBuffer: 1024 * 1024 * 50, // 50MB buffer
                timeout: 300000, // 5 minutos de timeout
              });

              if (stderr && !stderr.includes("warn")) {
                console.log("npm output:", stderr);
              }
            } catch (npmError: any) {
              console.error("Error en npm install:", npmError);

              // Si npm ci/install falla, intentarlo de otra forma
              try {
                const npmInstallAlt = `cd "${appRootDir}" && npm install`;
                await execAsync(npmInstallAlt, {
                  maxBuffer: 1024 * 1024 * 50,
                  timeout: 600000, // 10 minutos
                });
              } catch (npmError2: any) {
                console.error("npm install alternativo también falló:", npmError2);
                throw new Error(
                  `Error al instalar dependencias: ${npmError2.message}. Puede que necesites ejecutar 'npm install' manualmente.`
                );
              }
            }

            console.log("npm install completado exitosamente");
          }

          // Ejecutar npm run build para generar .next (Next.js)
          console.log("Ejecutando npm run build para compilar la aplicación...");
          let buildExecuted = false;
          let buildError: string | null = null;

          try {
            const buildCmd = `cd "${appRootDir}" && npm run build`;
            await execAsync(buildCmd, {
              maxBuffer: 1024 * 1024 * 50, // 50MB buffer
              timeout: 600000, // 10 minutos de timeout
            });
            buildExecuted = true;
            console.log("npm run build completado exitosamente");
          } catch (buildErr: any) {
            buildError = buildErr.message || "Error desconocido en build";
            console.error("Error en npm run build:", buildErr);
            // No lanzamos error, solo lo reportamos - la restauración sigue siendo exitosa
          }

          // Actualizar registro de restauración a exitoso
          const buildStatusMsg = buildExecuted
            ? "Restauración completada. Dependencias instaladas y aplicación compilada."
            : buildError
              ? `Restauración completada. npm install exitoso. Build tuvo problemas: ${buildError}`
              : "Restauración completada exitosamente.";

          await executeQuery({
            query: `
              UPDATE backup_logs 
              SET status = 'success', completed_at = NOW(), error_message = ?
              WHERE id = ?
            `,
            values: [buildStatusMsg, restoreLogId],
          });

          return res.status(200).json({
            success: true,
            message: buildExecuted
              ? "Restauración completada. Dependencias instaladas y aplicación compilada."
              : "Restauración completada. Puede que necesites ejecutar 'npm run build' manualmente.",
            backupId: backupIdNum,
            backupType: backup.backup_type,
            safetyBackupCreated,
            safetyBackupPath,
            wasEncrypted: isEncrypted,
            details: {
              npmInstallExecuted: npmInstallRequired,
              buildExecuted: buildExecuted,
              buildError: buildError,
              filesRestored: extractedFiles.length,
            },
          });
        }
      } catch (restoreError: any) {
        console.error("Error durante la restauración:", restoreError);

        // Limpiar archivo temporal descifrado si existe
        if (isEncrypted && workingFilePath !== filePath) {
          try {
            const tempDir = path.dirname(workingFilePath);
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error("Error al limpiar archivos temporales:", cleanupError);
          }
        }

        try {
          await executeQuery({
            query: `
              UPDATE backup_logs 
              SET status = 'failed', error_message = ?, completed_at = NOW()
              WHERE id = ?
            `,
            values: [restoreError.message, restoreLogId],
          });
        } catch (updateError) {
          console.error("Error al actualizar estado de restauración:", updateError);
        }

        return res.status(500).json({
          success: false,
          message: "Error al restaurar el backup",
          error: restoreError.message,
          safetyBackupCreated,
          safetyBackupPath: safetyBackupCreated ? safetyBackupPath : null,
          decryptionFailed: isEncrypted && restoreError.message?.includes("descifrar"),
        });
      }
    } catch (error: any) {
      console.error("Error en el proceso de restauración:", error);

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
        message: "Error en el proceso de restauración",
        error: error.message || "Error desconocido",
      });
    }
  }

  // GET: Obtener información de un backup específico
  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID del backup",
        });
      }

      const backupIdNum = parseInt(id as string, 10);
      if (isNaN(backupIdNum)) {
        return res.status(400).json({
          success: false,
          message: "ID de backup inválido",
        });
      }

      let backupInfo: any[] = [];
      try {
        backupInfo = (await executeQuery({
          query: `
            SELECT 
              id, backup_type, status, file_path, file_size, duration_seconds,
              error_message, checksum, compressed, encrypted, tables_count,
              records_count, created_by, created_at, completed_at
            FROM backup_logs 
            WHERE id = ?
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

      return res.status(200).json({
        success: true,
        backup: {
          id: backup.id,
          type: backup.backup_type,
          status: backup.status,
          filePath: backup.file_path,
          fileExists,
          size: backup.file_size || 0,
          sizeFormatted: formatBytes(backup.file_size),
          duration: backup.duration_seconds || 0,
          errorMessage: backup.error_message,
          checksum: backup.checksum,
          compressed: backup.compressed === 1,
          encrypted: backup.encrypted === 1,
          tablesCount: backup.tables_count || 0,
          recordsCount: backup.records_count || 0,
          createdBy: backup.created_by,
          createdAt: backup.created_at,
          completedAt: backup.completed_at,
        },
      });
    } catch (error: any) {
      console.error("Error al obtener información del backup:", error);

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
        message: "Error al obtener información del backup",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

// Función auxiliar para copiar el contenido de un directorio
async function copyDirectoryContents(
  src: string,
  dest: string
): Promise<void> {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Omitir ciertos archivos/directorios que no deben sobrescribirse
    if (
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name.startsWith(".")
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyDirectoryContents(srcPath, destPath);
    } else {
      // Crear directorio padre si no existe
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default withAuth(handler);
