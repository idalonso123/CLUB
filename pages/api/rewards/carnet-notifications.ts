import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

/**
 * API para obtener notificaciones de recompensas de carnets completados
 * GET /api/rewards/carnet-notifications
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

    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const userId = req.user.userId;
    
    // Obtener recompensas de carnet NO vistas y NO canjeadas
    const rewardsResult = await executeQuery({
      query: `
        SELECT 
          rcm.id,
          rcm.user_id AS userId,
          rcm.pet_card_id AS petCardId,
          rcm.product_articulo AS productArticulo,
          rcm.product_nombre AS productNombre,
          rcm.product_barcode AS productBarcode,
          rcm.product_pvp AS productPvp,
          rcm.pet_name AS petName,
          rcm.pet_type AS petType,
          rcm.vista,
          rcm.fecha_creacion AS fechaCreacion,
          rcm.fecha_expiracion AS fechaExpiracion
        FROM recompensas_carnet_mascota rcm
        WHERE rcm.user_id = ? 
          AND rcm.canjeada = 0
          AND rcm.vista = 0
        ORDER BY rcm.fecha_creacion DESC
        LIMIT 10
      `,
      values: [userId]
    });
    
    // Obtener la recompensa plantilla (tipo carnet) para usar su imagen y configuración
    const templateResult = await executeQuery({
      query: `
        SELECT 
          id,
          nombre AS name,
          descripcion AS description,
          imagen_url AS imageUrl,
          disponible AS available,
          categoria AS category
        FROM recompensas
        WHERE tipo_recompensa = 'carnet' AND disponible = 1
        LIMIT 1
      `
    }) as any[];
    
    const template = (templateResult && templateResult.length > 0) ? templateResult[0] : null;
    
    const notifications = (rewardsResult as any[]).map(reward => {
      // Verificar si ha expirado
      let isExpired = false;
      if (reward.fechaExpiracion) {
        const expDate = new Date(reward.fechaExpiracion);
        isExpired = expDate < new Date();
      }
      
      // Construir el nombre de la recompensa
      const rewardName = template 
        ? `Saco gratis de ${reward.productNombre}`
        : `Recompensa de carnet`;
      
      return {
        id: reward.id,
        rewardCarnetId: reward.id,
        petCardId: reward.petCardId,
        petName: reward.petName,
        petType: reward.petType,
        nombrePienso: reward.productNombre,
        productPvp: parseFloat(reward.productPvp) || 0,
        rewardName: rewardName,
        imageUrl: template?.imageUrl || null,
        isExpired: isExpired,
        fechaExpiracion: reward.fechaExpiracion,
        fechaCreacion: reward.fechaCreacion
      };
    });
    
    return res.status(200).json({
      success: true,
      notifications: notifications
    });
    
  } catch (error) {
    console.error('Error al obtener notificaciones de carnets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: (error as Error).message
    });
  }
}

export default withAuth(handler);