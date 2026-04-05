import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

/**
 * Extensiones de archivo permitidas para uploads
 * SECURITY: Lista blanca de tipos de archivo permitidos
 */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
]);

/**
 * Mapeo de extensiones a MIME types
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

/**
 * Directorio base para uploads
 */
const UPLOADS_DIR = 'uploads';

/**
 * Valida que el nombre de archivo sea seguro
 * SECURITY: Implementa protección contra path traversal y nombres maliciosos
 */
function validateFilename(filename: string): { valid: boolean; error?: string; safeName?: string } {
  // Verificar que filename sea string
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Nombre de archivo no válido' };
  }
  
  // Decodificar URL encoding
  const decodedFilename = decodeURIComponent(filename);
  
  // Verificar que no contenga caracteres peligrosos
  // Permite: letras, números, guiones, guiones bajos, puntos
  const safePattern = /^[a-zA-Z0-9_\-\.]+$/;
  if (!safePattern.test(decodedFilename)) {
    return { valid: false, error: 'Nombre de archivo contiene caracteres no permitidos' };
  }
  
  // Verificar que no tenga path traversal
  const normalizedPath = path.normalize(decodedFilename);
  if (normalizedPath.includes('..') || 
      normalizedPath.startsWith('/') || 
      normalizedPath.startsWith('\\') ||
      normalizedPath.includes('..' + path.sep)) {
    return { valid: false, error: 'Acceso denegado: ruta no permitida' };
  }
  
  // Verificar extensión
  const ext = path.extname(decodedFilename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }
  
  // Verificar longitud máxima del nombre
  if (decodedFilename.length > 255) {
    return { valid: false, error: 'Nombre de archivo demasiado largo' };
  }
  
  return { valid: true, safeName: normalizedPath };
}

/**
 * Verifica que la ruta final esté dentro del directorio de uploads
 * SECURITY: Previene ataques de symlink
 */
async function isPathSafe(baseDir: string, targetPath: string): Promise<boolean> {
  const realBaseDir = path.resolve(baseDir);
  const realTargetPath = path.resolve(baseDir, targetPath);
  
  // Verificar que el path resuelto esté dentro del directorio base
  return realTargetPath.startsWith(realBaseDir + path.sep) || realTargetPath === realBaseDir;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }
  
  try {
    const { filename } = req.query;
    
    // Validar nombre de archivo
    const validation = validateFilename(filename as string);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    const safeFilename = validation.safeName!;
    
    // Construir ruta base
    const baseDir = path.join(process.cwd(), UPLOADS_DIR);
    const filePath = path.join(baseDir, safeFilename);
    
    // Verificar que el archivo esté dentro del directorio de uploads
    const isSafe = await isPathSafe(baseDir, safeFilename);
    if (!isSafe) {
      console.error(`Intento de acceso fuera del directorio: ${filePath}`);
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    
    // Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }
    
    // Obtener información del archivo para logging
    const stats = await fs.stat(filePath);
    
    // Verificar tamaño máximo (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (stats.size > MAX_FILE_SIZE) {
      return res.status(413).json({ success: false, error: 'Archivo demasiado grande' });
    }
    
    // Leer archivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar MIME type
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Establecer headers de seguridad y caché
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Caché con versioning (los archivos en uploads pueden cambiar)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error al servir el archivo:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}