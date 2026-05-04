import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

/**
 * API para marcar como vistas las notificaciones de recompensas de carnets
 * PUT /api/rewards/carnet-notifications/dismiss
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const userId = req.user.userId;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren IDs de notificaciones'
      });
    }
    
    // Marcar como vistas las notificaciones seleccionadas
    // Solo marcamos las que pertenecen al usuario actual
    const placeholders = notificationIds.map(() => '?').join(',');
    const values = [...notificationIds, userId];
    
    const result = await executeQuery({
      query: `
        UPDATE recompensas_carnet_mascota 
        SET vista = 1
        WHERE id IN (${placeholders}) AND user_id = ? AND canjeada = 0
      `,
      values: values
    });
    
    const affectedRows = (result as any).affectedRows || 0;
    
    return res.status(200).json({
      success: true,
      message: `${affectedRows} notificación(es) marcada(s) como vista(s)`,
      dismissedCount: affectedRows
    });
    
  } catch (error) {
    console.error('Error al marcar notificaciones como vistas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: (error as Error).message
    });
  }
}

export default withAuth(handler);