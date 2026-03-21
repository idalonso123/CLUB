import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function propertyHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad',
    });
  }

  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no válido',
    });
  }
  
  // Solo permitir métodos GET y PUT
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
    });
  }

  try {
    // Primero obtenemos el código de usuario desde la tabla personas
    const userResult = await executeQuery({
      query: 'SELECT codigo FROM personas WHERE codigo = ?',
      values: [id],
    });

    const users = userResult as any[];
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const userCode = users[0].codigo;
    
    // Si es método PUT, actualizamos los datos de propiedad
    if (req.method === 'PUT') {
      const { characteristics, animals, description = '', surfaceArea = 0 } = req.body;
      
      // Convertir arrays a formato SET de MySQL
      const characteristicsString = Array.isArray(characteristics) ? characteristics.join(',') : '';
      const animalsString = Array.isArray(animals) ? animals.join(',') : '';
      
      // Verificar si ya existe una propiedad para este usuario
      const propertyExists = await executeQuery({
        query: 'SELECT 1 FROM propiedades WHERE codigo = ?',
        values: [userCode],
      });
      
      if ((propertyExists as any[]).length > 0) {
        // Actualizar propiedad existente
        await executeQuery({
          query: `
            UPDATE propiedades
            SET caracteristicas_vivienda = ?,
                animales = ?,
                descripcion_vivienda = ?,
                superficie_terreno = ?
            WHERE codigo = ?
          `,
          values: [characteristicsString, animalsString, description, surfaceArea, userCode],
        });
      } else {
        // Insertar nueva propiedad
        await executeQuery({
          query: `
            INSERT INTO propiedades 
            (caracteristicas_vivienda, animales, descripcion_vivienda, superficie_terreno, codigo)
            VALUES (?, ?, ?, ?, ?)
          `,
          values: [characteristicsString, animalsString, description, surfaceArea, userCode],
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Datos de propiedad actualizados correctamente'
      });
    }

    // Consultamos la información de propiedades
    const propertyResult = await executeQuery({
      query: `SELECT 
        caracteristicas_vivienda, 
        animales, 
        descripcion_vivienda, 
        superficie_terreno 
      FROM propiedades 
      WHERE codigo = ?`,
      values: [userCode],
    });

    const properties = propertyResult as any[];
    
    if (properties.length === 0) {
      return res.status(200).json({ 
        success: true,
        propertyData: null,
        message: 'No hay datos de propiedad para este usuario' 
      });
    }

    const propertyRecord = properties[0];
    
    // Transformamos los sets de MySQL a arrays de strings
    const characteristics = propertyRecord.caracteristicas_vivienda 
      ? propertyRecord.caracteristicas_vivienda.split(',') 
      : [];
    
    const animals = propertyRecord.animales 
      ? propertyRecord.animales.split(',') 
      : [];

    // Construimos el objeto de datos de propiedad
    const propertyData = {
      characteristics,
      animals,
      description: propertyRecord.descripcion_vivienda || '',
      surfaceArea: propertyRecord.superficie_terreno || 0
    };

    return res.status(200).json({
      success: true,
      propertyData
    });
  } catch (error) {
    console.error('Error al obtener datos de propiedad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos de propiedad',
      error: (error as Error).message,
    });
  }
}

export default withAuth(propertyHandler);
