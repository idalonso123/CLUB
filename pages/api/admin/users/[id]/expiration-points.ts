import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function expirationPointsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad',
    });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
    });
  }
  const { id } = req.query;
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: 'ID de usuario no válido' });
  }
  try {
    const userResult = await executeQuery({
      query: 'SELECT codigo, nombres, apellidos, puntos FROM personas WHERE codigo = ?',
      values: [id],
    }) as Array<{ codigo: number, nombres: string, apellidos: string, puntos: number }>;
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const user = userResult[0];
    const expirationResult = await executeQuery({
      query: `
        SELECT 
          id,
          puntos,
          fecha_ingreso,
          fecha_caducidad,
          caducado
        FROM 
          puntos_caducidad
        WHERE 
          persona_id = ?
        ORDER BY 
          fecha_ingreso DESC
      `,
      values: [id],
    }) as Array<{ 
      id: number, 
      puntos: number, 
      fecha_ingreso: string, 
      fecha_caducidad: string, 
      caducado: number 
    }>;
    const puntosActivos = expirationResult
      .filter(item => item.caducado === 0)
      .reduce((sum, item) => sum + item.puntos, 0);
    const puntosCaducados = expirationResult
      .filter(item => item.caducado === 1)
      .reduce((sum, item) => sum + item.puntos, 0);
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
    return res.status(200).json({
      success: true,
      user: {
        id: user.codigo,
        nombre: `${user.nombres} ${user.apellidos}`,
        puntosTotales: user.puntos
      },
      resumen: {
        puntosActivos,
        puntosCaducados,
        resumenPorMes: Object.entries(resumenPorMes).map(([mesAno, puntos]) => ({
          mesAno,
          puntos
        })).sort((a, b) => a.mesAno.localeCompare(b.mesAno))
      },
      detalle: expirationResult.map(item => ({
        id: item.id,
        puntos: item.puntos,
        fechaIngreso: item.fecha_ingreso,
        fechaCaducidad: item.fecha_caducidad,
        caducado: item.caducado === 1,
        diasRestantes: item.caducado === 0 
          ? Math.max(0, Math.floor((new Date(item.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
          : 0
      }))
    });
  } catch (error) {
    console.error('Error al obtener información de caducidad de puntos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener información de caducidad de puntos',
      error: (error as Error).message,
    });
  }
}

export default withAuth(expirationPointsHandler);