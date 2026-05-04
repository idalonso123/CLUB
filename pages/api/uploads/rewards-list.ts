import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

/**
 * Directorio base para uploads de recompensas
 */
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'rewards');

/**
 * Extensiones de archivo permitidas para imágenes
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

/**
 * Tipos MIME permitidos
 */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

interface ImageInfo {
  name: string;
  url: string;
  size: number;
  type: string;
  modifiedAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    // Verificar que existe el directorio
    try {
      await fs.access(UPLOADS_DIR);
    } catch {
      // El directorio no existe, devolver lista vacía
      return res.status(200).json({
        success: true,
        images: [],
        message: 'No hay imágenes subidas todavía'
      });
    }

    // Leer archivos del directorio
    const files = await fs.readdir(UPLOADS_DIR);
    
    // Filtrar solo imágenes
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext);
    });

    // Obtener información de cada imagen
    const images: ImageInfo[] = await Promise.all(
      imageFiles.map(async (file) => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = await fs.stat(filePath);
        const ext = path.extname(file).toLowerCase();

        return {
          name: file,
          url: `/uploads/rewards/${file}`,
          size: stats.size,
          type: ALLOWED_MIME_TYPES[ext] || 'image/unknown',
          modifiedAt: stats.mtime.toISOString()
        };
      })
    );

    // Ordenar por fecha de modificación (más recientes primero)
    images.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );

    return res.status(200).json({
      success: true,
      images,
      count: images.length
    });
  } catch (error) {
    console.error('Error al listar imágenes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la lista de imágenes'
    });
  }
}
