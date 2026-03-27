import { NextApiResponse } from 'next';
import { AuthenticatedRequest, withAuth } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function userExpirationPointsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
    });
  }

  try {
    // Obtener el ID del usuario autenticado
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Verificar que el usuario existe
    const userResult = await executeQuery({
      query: 'SELECT codigo, nombres, apellidos, puntos FROM personas WHERE codigo = ?',
      values: [userId],
    }) as Array<{ codigo: number, nombres: string, apellidos: string, puntos: number }>;

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = userResult[0];

    // Obtener información de caducidad de puntos
    const expirationResult = await executeQuery({
      query: `
        SELECT id, puntos, fecha_ingreso, fecha_caducidad, caducado
        FROM puntos_caducidad
        WHERE persona_id = ?
        ORDER BY fecha_ingreso DESC
      `,
      values: [userId],
    }) as Array<{ 
      id: number, 
      puntos: number, 
      fecha_ingreso: string, 
      fecha_caducidad: string, 
      caducado: number 
    }>;

    // Calcular puntos activos y caducados
    const puntosActivos = expirationResult
      .filter(item => item.caducado === 0)
      .reduce((sum, item) => sum + item.puntos, 0);
    
    const puntosCaducados = expirationResult
      .filter(item => item.caducado === 1)
      .reduce((sum, item) => sum + item.puntos, 0);

    // Agrupar por mes de caducidad para mostrar un resumen
    const resumenPorMes: Record<string, number> = {};
    
    expirationResult
      .filter(item => item.caducado === 0)
      .forEach(item => {
        const fecha = new Date(item.fecha_caducidad);
        const mesAno = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!resumenPorMes[mesAno]) {
          resumenPorMes[mesAno] = 0;
        }
        
        resumenPorMes[mesAno] += item.puntos;
      });

    // Calcular días restantes para cada punto activo
    const now = new Date();
    const expirationData = expirationResult.map(item => {
      const fechaCaducidad = new Date(item.fecha_caducidad);
      const diasRestantes = item.caducado ? 0 : Math.max(0, Math.ceil((fechaCaducidad.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        ...item,
        diasRestantes
      };
    });

    // Ordenar el resumen por mes
    const resumenOrdenado = Object.entries(resumenPorMes)
      .map(([mesAno, puntos]) => ({ mesAno, puntos }))
      .sort((a, b) => a.mesAno.localeCompare(b.mesAno));

    return res.status(200).json({
      success: true,
      user: {
        id: user.codigo,
        name: `${user.nombres} ${user.apellidos}`,
        totalPoints: user.puntos
      },
      expiration: {
        puntosActivos,
        puntosCaducados,
        resumenPorMes: resumenOrdenado,
        detalle: expirationData
      }
    });
  } catch (error) {
    console.error('Error al obtener información de caducidad de puntos:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
}

export default withAuth(userExpirationPointsHandler);
