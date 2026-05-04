/**
 * Módulo de utilidades para el cifrado AES-256 de backups
 * Proporciona funciones para cifrar y descifrar archivos de backup
 */

import crypto from "crypto";

/**
 * Configuración del cifrado AES-256-CBC
 */
interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

const ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: "aes-256-cbc",
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32,
  iterations: 100000,
};

/**
 * Deriva una clave de cifrado desde una contraseña usando PBKDF2
 * @param password - Contraseña proporcionada por el usuario
 * @param salt - Salt generado aleatoriamente
 * @returns Clave de 256 bits derivada
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    "sha512"
  );
}

/**
 * Cifra un archivo usando AES-256-CBC con contraseña
 * @param inputPath - Ruta del archivo a cifrar
 * @param outputPath - Ruta donde guardar el archivo cifrado
 * @param password - Contraseña para el cifrado
 * @returns información del proceso de cifrado
 */
export async function encryptFile(
  inputPath: string,
  outputPath: string,
  password: string
): Promise<{ success: boolean; outputPath: string; originalSize: number; encryptedSize: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      // Verificar que el archivo existe
      const fs = require("fs");
      if (!fs.existsSync(inputPath)) {
        resolve({
          success: false,
          outputPath: "",
          originalSize: 0,
          encryptedSize: 0,
          error: "El archivo de entrada no existe",
        });
        return;
      }

      // Leer el archivo original
      const originalData = fs.readFileSync(inputPath);
      const originalSize = originalData.length;

      // Generar salt aleatorio
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);

      // Derivar la clave desde la contraseña
      const key = deriveKey(password, salt);

      // Generar IV aleatorio
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

      // Crear el cifrador
      const cipher = crypto.createCipheriv(
        ENCRYPTION_CONFIG.algorithm,
        key,
        iv
      );

      // Cifrar los datos
      const encrypted = Buffer.concat([
        cipher.update(originalData),
        cipher.final(),
      ]);

      // Crear el archivo cifrado con metadatos
      // Formato: SALT (32) + IV (16) + DATOS CIFRADOS
      const outputData = Buffer.concat([salt, iv, encrypted]);
      
      // Escribir el archivo cifrado
      fs.writeFileSync(outputPath, outputData);

      const encryptedSize = outputData.length;

      resolve({
        success: true,
        outputPath,
        originalSize,
        encryptedSize,
      });
    } catch (error: any) {
      resolve({
        success: false,
        outputPath: "",
        originalSize: 0,
        encryptedSize: 0,
        error: error.message || "Error desconocido al cifrar",
      });
    }
  });
}

/**
 * Descifra un archivo usando AES-256-CBC con contraseña
 * @param inputPath - Ruta del archivo cifrado
 * @param outputPath - Ruta donde guardar el archivo descifrado
 * @param password - Contraseña para el descifrado
 * @returns información del proceso de descifrado
 */
export async function decryptFile(
  inputPath: string,
  outputPath: string,
  password: string
): Promise<{ success: boolean; outputPath: string; encryptedSize: number; decryptedSize: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      // Verificar que el archivo existe
      const fs = require("fs");
      if (!fs.existsSync(inputPath)) {
        resolve({
          success: false,
          outputPath: "",
          encryptedSize: 0,
          decryptedSize: 0,
          error: "El archivo cifrado no existe",
        });
        return;
      }

      // Leer el archivo cifrado
      const encryptedData = fs.readFileSync(inputPath);
      const encryptedSize = encryptedData.length;

      // Verificar que el archivo tiene el tamaño mínimo
      const minSize = ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + 1;
      if (encryptedSize < minSize) {
        resolve({
          success: false,
          outputPath: "",
          encryptedSize,
          decryptedSize: 0,
          error: "El archivo cifrado está corrupto o tiene un formato inválido",
        });
        return;
      }

      // Extraer salt, IV y datos cifrados
      const salt = encryptedData.subarray(0, ENCRYPTION_CONFIG.saltLength);
      const iv = encryptedData.subarray(
        ENCRYPTION_CONFIG.saltLength,
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
      );
      const encrypted = encryptedData.subarray(
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
      );

      // Derivar la clave desde la contraseña
      const key = deriveKey(password, salt);

      // Crear el descifrador
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_CONFIG.algorithm,
        key,
        iv
      );

      // Descifrar los datos
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Escribir el archivo descifrado
      fs.writeFileSync(outputPath, decrypted);

      const decryptedSize = decrypted.length;

      resolve({
        success: true,
        outputPath,
        encryptedSize,
        decryptedSize,
      });
    } catch (error: any) {
      // Manejar errores específicos
      let errorMessage = error.message || "Error desconocido al descifrar";
      
      if (error.message?.includes("finalize")) {
        errorMessage = "Contraseña incorrecta o archivo corrupto";
      }
      
      resolve({
        success: false,
        outputPath: "",
        encryptedSize: 0,
        decryptedSize: 0,
        error: errorMessage,
      });
    }
  });
}

/**
 * Verifica si un archivo está cifrado (basado en el formato)
 * @param filePath - Ruta del archivo a verificar
 * @returns true si el archivo parece estar cifrado
 */
export function isFileEncrypted(filePath: string): boolean {
  try {
    const fs = require("fs");
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const stats = fs.statSync(filePath);
    // Los archivos cifrados tienen un tamaño mínimo (salt + IV + datos)
    const minSize = ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + 16;
    
    return stats.size >= minSize;
  } catch {
    return false;
  }
}

/**
 * Genera un hash de la contraseña para verificar sin almacenarla
 * @param password - Contraseña a hashear
 * @returns Hash SHA-256 de la contraseña
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Valida que una contraseña cumpla con los requisitos mínimos
 * @param password - Contraseña a validar
 * @returns objeto con información de validación
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  encryptFile,
  decryptFile,
  isFileEncrypted,
  hashPassword,
  validatePassword,
};