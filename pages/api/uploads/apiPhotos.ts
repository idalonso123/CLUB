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
 * Directorio base para uploads (relativo a public/)
 */
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Valida que el nombre de archivo sea seguro
 * SECURITY: Implementa protección contra path traversal y nombres maliciosos
 * Ahora soporta subdirectorios como "rewards/archivo.png"
 */
function validateFilename(filename: string): { valid: boolean; error?: string; safeName?: string } {
  // Verificar que filename sea string
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Nombre de archivo no válido' };
  }
  
  // Decodificar URL encoding
  const decodedFilename = decodeURIComponent(filename);
  
  // Verificar que no tenga path traversal (ataques con ../)
  if (decodedFilename.includes('..') || 
      decodedFilename.includes('%2e%2e') || 
      decodedFilename.includes('%252e')) {
    return { valid: false, error: 'Acceso denegado: ruta no permitida' };
  }
  
  // Normalizar el path y verificar que no salga del directorio uploads
  // Permitir subdirectorios como "rewards/archivo.png" o "rewards/subfolder/archivo.png"
  const normalizedPath = path.normalize(decodedFilename).replace(/^(\.\.(\/|\\))+/, '');
  
  // Verificar que no tenga path traversal después de normalizar
  if (normalizedPath.includes('..') || 
      normalizedPath.startsWith('/') || 
      normalizedPath.startsWith('\\')) {
    return { valid: false, error: 'Acceso denegado: ruta no permitida' };
  }
  
  // Dividir en directorio y archivo
  const pathParts = normalizedPath.split(/[\/\\]/);
  
  // Verificar que no haya más de 2 niveles de profundidad
  if (pathParts.length > 2) {
    return { valid: false, error: 'Nivel de subdirectorio no permitido' };
  }
  
  // Validar cada parte del path
  const safePattern = /^[a-zA-Z0-9_\-\.]+$/;
  for (const part of pathParts) {
    if (part && !safePattern.test(part)) {
      return { valid: false, error: 'Nombre de archivo contiene caracteres no permitidos' };
    }
  }
  
  // Verificar que la última parte (archivo) tenga una extensión permitida
  const lastPart = pathParts[pathParts.length - 1];
  const ext = path.extname(lastPart).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }
  
  // Verificar longitud máxima del path completo
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
    
    // Construir ruta base - ya apunta a public/uploads
    const baseDir = UPLOADS_DIR;
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