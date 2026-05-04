/**
 * Módulo de verificación de integridad de backups
 * Utiliza checksums SHA-256 para verificar que los archivos no han sido alterados
 */

import crypto from "crypto";
import fs from "fs";

/**
 * Resultado de verificación de integridad
 */
export interface IntegrityCheckResult {
  success: boolean;
  isValid: boolean;
  algorithm: string;
  originalChecksum?: string;
  currentChecksum?: string;
  error?: string;
}

/**
 * Calcula el checksum SHA-256 de un archivo
 * @param filePath - Ruta del archivo
 * @returns Checksum SHA-256 en formato hexadecimal
 */
export function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

/**
 * Verifica la integridad de un archivo comparando su checksum con uno registrado
 * @param filePath - Ruta del archivo a verificar
 * @param expectedChecksum - Checksum esperado (almacenado)
 * @returns Resultado de la verificación de integridad
 */
export function verifyFileIntegrity(
  filePath: string,
  expectedChecksum: string
): IntegrityCheckResult {
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        isValid: false,
        algorithm: "SHA-256",
        originalChecksum: expectedChecksum,
        error: "El archivo no existe",
      };
    }

    // Calcular el checksum actual
    const currentChecksum = calculateChecksum(filePath);

    // Comparar checksums
    const isValid = currentChecksum === expectedChecksum;

    return {
      success: true,
      isValid,
      algorithm: "SHA-256",
      originalChecksum: expectedChecksum,
      currentChecksum,
    };
  } catch (error: any) {
    return {
      success: false,
      isValid: false,
      algorithm: "SHA-256",
      originalChecksum: expectedChecksum,
      error: error.message || "Error al verificar integridad",
    };
  }
}

/**
 * Verifica la integridad de un backup antes de restaurarlo
 * @param filePath - Ruta del archivo de backup
 * @param expectedChecksum - Checksum esperado de la base de datos
 * @param isEncrypted - Indica si el archivo está cifrado
 * @returns Resultado de la verificación
 */
export async function verifyBackupIntegrity(
  filePath: string,
  expectedChecksum: string,
  isEncrypted: boolean = false
): Promise<IntegrityCheckResult> {
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        isValid: false,
        algorithm: "SHA-256",
        originalChecksum: expectedChecksum,
        error: "El archivo de backup no existe",
      };
    }

    // Si el archivo está cifrado, no podemos verificar la integridad
    // hasta que no se descifre (se hace después en el proceso de restauración)
    if (isEncrypted) {
      return {
        success: true,
        isValid: true,
        algorithm: "SHA-256",
        originalChecksum: expectedChecksum,
        currentChecksum: "VERIFICACIÓN_PENDIENTE",
        error: "El archivo está cifrado. La verificación se realizará después del descifrado.",
      };
    }

    // Calcular checksum actual
    const currentChecksum = calculateChecksum(filePath);
    const isValid = currentChecksum === expectedChecksum;

    return {
      success: true,
      isValid,
      algorithm: "SHA-256",
      originalChecksum: expectedChecksum,
      currentChecksum,
    };
  } catch (error: any) {
    return {
      success: false,
      isValid: false,
      algorithm: "SHA-256",
      originalChecksum: expectedChecksum,
      error: error.message || "Error al verificar integridad del backup",
    };
  }
}

/**
 * Genera un checksum para un buffer de datos
 * Útil para verificar integridad de datos en memoria
 * @param data - Buffer de datos
 * @returns Checksum SHA-256 en formato hexadecimal
 */
export function calculateDataChecksum(data: Buffer): string {
  const hashSum = crypto.createHash("sha256");
  hashSum.update(data);
  return hashSum.digest("hex");
}

/**
 * Verifica si un checksum tiene el formato correcto
 * @param checksum - Checksum a validar
 * @returns true si el formato es válido (64 caracteres hexadecimales)
 */
export function isValidChecksumFormat(checksum: string | null | undefined): boolean {
  if (!checksum || typeof checksum !== "string") {
    return false;
  }
  // SHA-256 produce 64 caracteres hexadecimales
  return /^[a-fA-F0-9]{64}$/.test(checksum);
}

export default {
  calculateChecksum,
  verifyFileIntegrity,
  verifyBackupIntegrity,
  calculateDataChecksum,
  isValidChecksumFormat,
};
