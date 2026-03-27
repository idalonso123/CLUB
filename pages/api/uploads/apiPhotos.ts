import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { filename } = req.query;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Nombre de archivo no válido' });
    }
    if (filename.includes('..')) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    const filePath = path.join(process.cwd(), 'uploads', filename);
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`Archivo no encontrado: ${filePath}`, error);
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf'
    };
    if (ext in mimeTypes) {
      contentType = mimeTypes[ext];
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Content-Type', contentType);
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error al servir el archivo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}