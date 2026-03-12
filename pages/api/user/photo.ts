import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function photoHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // Manejar la eliminación de la foto
  if (req.method === 'DELETE') {
    try {
      // Obtener la URL actual de la foto del usuario
      const [userResult] = await executeQuery({
        query: 'SELECT foto_url FROM personas WHERE codigo = ?',
        values: [req.user.userId]
      }) as any[];
      
      if (!userResult || !userResult.foto_url || userResult.foto_url === '/default-avatar.jpg') {
        // No hay foto para eliminar o es la foto por defecto
        return res.status(200).json({
          success: true,
          message: 'No hay foto personalizada para eliminar'
        });
      }
      
      // Ruta completa del archivo a eliminar
      const filePath = path.join(process.cwd(), userResult.foto_url.startsWith('/uploads/') ? '' : 'public', userResult.foto_url.replace(/^\//, ''));
      
      try {
        // Verificar si el archivo existe antes de intentar eliminarlo
        await fs.access(filePath);
        // Eliminar el archivo físico
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('El archivo no existe o no se pudo eliminar:', fileError);
        // Continuamos con la actualización de la base de datos aunque el archivo no exista
      }
      
      // Actualizar la base de datos para eliminar la referencia a la foto
      await executeQuery({
        query: 'UPDATE personas SET foto_url = NULL WHERE codigo = ?',
        values: [req.user.userId]
      });
      
      return res.status(200).json({
        success: true,
        message: 'Foto de perfil eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar la foto de perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar la foto de perfil',
        error: (error as Error).message
      });
    }
  }
  
  // Manejar la actualización de la foto
  try {
    // Procesar el formulario con formidable
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      filter: ({ name, mimetype }) => {
        return name === 'photo' && 
          ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimetype || '');
      },
    });
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    // Obtener el archivo de la foto
    const photoFile = files.photo;
    if (!photoFile || (Array.isArray(photoFile) && photoFile.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna foto'
      });
    }
    
    // Obtener la URL actual de la foto del usuario para eliminarla después
    const [userResult] = await executeQuery({
      query: 'SELECT foto_url FROM personas WHERE codigo = ?',
      values: [req.user.userId]
    }) as any[];
    
    // Guardar la URL de la foto anterior si existe y no es la foto por defecto
    const previousPhotoUrl = userResult?.foto_url && userResult.foto_url !== '/default-avatar.jpg' ? userResult.foto_url : null;

    const file = Array.isArray(photoFile) ? photoFile[0] : photoFile;
    
    if (!file || !file.filepath) {
      return res.status(400).json({
        success: false,
        message: 'Archivo de foto inválido o no se pudo procesar correctamente'
      });
    }
    
    // Generar un nombre único para el archivo
    const originalFilename = file.originalFilename || file.newFilename || 'photo.jpg';
    const fileExt = path.extname(originalFilename);
    const newFilename = `${nanoid()}${fileExt || '.jpg'}`;
    
    // Directorio para guardar las fotos
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Asegurar que el directorio existe
    await fs.mkdir(uploadDir, { recursive: true });
    
    try {
      // Guardar la foto en el servidor
      await fs.copyFile(
        file.filepath,
        path.join(uploadDir, newFilename)
      );
    } catch (copyError) {
      console.error('Error al copiar el archivo:', copyError);
      return res.status(500).json({
        success: false,
        message: 'Error al guardar la foto en el servidor',
        error: (copyError as Error).message
      });
    }
    
    // URL relativa para almacenar en la base de datos
    const photoUrl = `/uploads/${newFilename}`;
    
    // Actualizar la URL de la foto en la base de datos
    await executeQuery({
      query: 'UPDATE personas SET foto_url = ? WHERE codigo = ?',
      values: [photoUrl, req.user.userId]
    });
    
    // Eliminar la foto temporal
    try {
      await fs.unlink(file.filepath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar el archivo temporal:', unlinkError);
      // Continuamos con el proceso aunque no se pueda eliminar el archivo temporal
    }
    
    // Eliminar la foto anterior si existía
    if (previousPhotoUrl) {
      try {
        const previousFilePath = path.join(process.cwd(), previousPhotoUrl.startsWith('/uploads/') ? '' : 'public', previousPhotoUrl.replace(/^\//, ''));
        // Verificar si el archivo existe antes de intentar eliminarlo
        await fs.access(previousFilePath);
        // Eliminar el archivo físico
        await fs.unlink(previousFilePath);
        console.log(`Foto anterior eliminada: ${previousPhotoUrl}`);
      } catch (fileError) {
        console.warn('No se pudo eliminar la foto anterior:', fileError);
        // Continuamos con el proceso aunque no se pueda eliminar la foto anterior
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('Error al actualizar la foto de perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la foto de perfil',
      error: (error as Error).message
    });
  }
}

export default withAuth(photoHandler);