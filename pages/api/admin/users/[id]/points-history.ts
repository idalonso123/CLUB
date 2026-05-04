import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function userPointsHistoryHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  // Obtener ID del usuario
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no válido'
    });
  }
  
  // Parámetros de paginación
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Máximo 50 registros por página
  const offset = (page - 1) * limit;

  try {
    // Verificar que el usuario existe
    const userExists = await executeQuery({
      query: 'SELECT 1 FROM personas WHERE codigo = ?',
      values: [id]
    });
    
    if ((userExists as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener el total de registros para la paginación
    const totalCountResult = await executeQuery({
      query: 'SELECT COUNT(*) as total FROM logs_points WHERE persona_id = ?',
      values: [id]
    });
    
    const totalItems = (totalCountResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Obtener el historial de puntos con paginación
    const historyResult = await executeQuery({
      query: `
        SELECT 
          rp.id,
          rp.tipo,
          rp.actor_id,
          CONCAT(p.nombres, ' ', p.apellidos) as actor_name,
          rp.puntos,
          rp.puntos_previos,
          rp.puntos_nuevos,
          rp.motivo,
          rp.fecha
        FROM 
          logs_points rp
        LEFT JOIN 
          personas p ON rp.actor_id = p.codigo
        WHERE 
          rp.persona_id = ?
        ORDER BY 
          rp.fecha DESC
        LIMIT ? OFFSET ?
      `,
      values: [id, limit, offset]
    });
    
    return res.status(200).json({
      success: true,
      history: historyResult,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error al obtener historial de puntos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de puntos',
      error: (error as Error).message
    });
  }
}

export default withAuth(userPointsHistoryHandler);