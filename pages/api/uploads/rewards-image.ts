import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
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
 * Tipos MIME permitidos
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Directorio base para uploads de recompensas
 */
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'rewards');

/**
 * Tamaño máximo de archivo (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Configuración de formidable para parsing de multipart/form-data
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Genera un nombre de archivo único y seguro
 * Maneja correctamente caracteres unicode y acentos
 */
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  // Normalizar y sanitizar el nombre base
  // Primero normalizar unicode (NFD) para separar acentos de letras
  const normalized = baseName.normalize('NFD');
  // Eliminar marcas diacríticas (acentos, etc.)
  const withoutDiacritics = normalized.replace(/[\u0300-\u036f]/g, '');
  // Convertir a minúsculas y reemplazar caracteres no válidos con guiones
  const sanitizedBase = withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  // Si el nombre está vacío después de sanitizar, usar un nombre genérico
  const finalBase = sanitizedBase || 'imagen';
  
  return `${finalBase}-${timestamp}-${random}${ext}`;
}

/**
 * Valida que el archivo sea seguro
 */
function validateFile(file: formidable.File): { valid: boolean; error?: string } {
  // Verificar que existe
  if (!file || !file.filepath) {
    return { valid: false, error: 'Archivo no válido' };
  }

  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Verificar extensión
  const ext = path.extname(file.originalFilename || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Use: JPG, PNG, GIF, WebP o SVG' };
  }

  // Verificar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as string)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }

  return { valid: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    // Asegurar que existe el directorio de uploads
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Parsear el formulario
    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }) => {
        return ALLOWED_MIME_TYPES.includes(mimetype || '');
      }
    });

    const [fields, files] = await form.parse(req);

    // Obtener el archivo subido
    const file = files.image?.[0];
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No se ha subido ninguna imagen' });
    }

    // Validar el archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      // Eliminar archivo temporal si hay error
      try {
        await fs.unlink(file.filepath);
      } catch {}
      return res.status(400).json({ success: false, error: validation.error });
    }

    // Generar nombre único
    const newFilename = generateUniqueFilename(file.originalFilename || 'image');
    const newFilePath = path.join(UPLOADS_DIR, newFilename);

    // Mover archivo temporal a destino final
    await fs.rename(file.filepath, newFilePath);

    // Devolver la URL relativa de la imagen
    const imageUrl = `/uploads/rewards/${newFilename}`;

    return res.status(200).json({
      success: true,
      message: 'Imagen subida correctamente',
      imageUrl,
      filename: newFilename,
      originalName: file.originalFilename,
      size: file.size
    });
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al subir la imagen. Inténtelo de nuevo.' 
    });
  }
}
