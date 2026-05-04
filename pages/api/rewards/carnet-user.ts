import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // GET: Obtener recompensas de carnet del usuario actual
    if (req.method === 'GET') {
      const userId = req.user.userId;
      
      // Obtener recompensas de carnet no canjeadas
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
            rcm.usada,
            rcm.canjeada,
            rcm.vista,
            rcm.fecha_creacion AS fechaCreacion,
            rcm.fecha_expiracion AS fechaExpiracion,
            rcm.fecha_usada AS fechaUsada,
            rcm.notas
          FROM recompensas_carnet_mascota rcm
          WHERE rcm.user_id = ? AND rcm.canjeada = 0
          ORDER BY rcm.fecha_creacion DESC
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
            categoria AS category,
            stock,
            canjeo_multiple AS canjeoMultiple,
            expiracion_activa AS expiracionActiva,
            duracion_meses AS duracionMeses,
            cooldown_horas AS cooldownHoras,
            cooldown_mode AS cooldownMode
          FROM recompensas
          WHERE tipo_recompensa = 'carnet' AND disponible = 1
          LIMIT 1
        `
      }) as any[];
      
      // Formatear las recompensas con la información de la plantilla
      const template = (templateResult && templateResult.length > 0) ? templateResult[0] : null;
      
      const rewards = (rewardsResult as any[]).map(reward => {
        // Verificar si ha expirado
        let isExpired = false;
        if (reward.fechaExpiracion) {
          const expDate = new Date(reward.fechaExpiracion);
          isExpired = expDate < new Date();
        }
        
        // Construir el nombre de la recompensa con el nombre del pienso
        const rewardName = template 
          ? `Saco gratis de ${reward.productNombre}`
          : `Recompensa de carnet`;
        
        return {
          // Campos específicos de la recompensa de carnet
          id: reward.id,
          rewardCarnetId: reward.id, // ID en la tabla recompensas_carnet_mascota
          userId: reward.userId,
          petCardId: reward.petCardId,
          nombrePienso: reward.productNombre,
          productArticulo: reward.productArticulo,
          productNombre: reward.productNombre,
          productBarcode: reward.productBarcode,
          productPvp: parseFloat(reward.productPvp) || 0, // Convertir a número para usar toFixed()
          petName: reward.petName,
          petType: reward.petType,
          // Campos necesarios para el filtrado en CarnetRewardsList
          usada: !!reward.usada, // Convertir a booleano
          canjeada: !!reward.canjeada, // Convertir a booleano
          vista: !!reward.vista, // Convertir a booleano
          fechaCreacion: reward.fechaCreacion,
          fechaExpiracion: reward.fechaExpiracion,
          fechaUsada: reward.fechaUsada,
          isExpired: isExpired,
          // Campos de la recompensa base (plantilla)
          templateId: template?.id || 0, // ID de la recompensa plantilla
          name: rewardName,
          description: template?.description || `Saco gratis de ${reward.productNombre} - Canjeado por completar tu carnet de mascota`,
          points: 0, // Las recompensas de carnet no cuestan puntos
          tipoRecompensa: 'carnet',
          imageUrl: template?.imageUrl || null,
          available: template?.available !== false && !isExpired,
          category: template?.category || 'Alimentación',
          stock: -1, // Ilimitado por defecto
          canjeoMultiple: template?.canjeoMultiple === 1,
          expiracionActiva: !!reward.fechaExpiracion,
          duracionMeses: template?.duracionMeses || 1,
          cooldownHoras: template?.cooldownHoras || 0,
          cooldownMode: template?.cooldownMode || 'same_day',
          barcodes: [] // Se obtienen de la plantilla
        };
      });
      
      return res.status(200).json({
        success: true,
        recompensas: rewards, // ← Cambiado de "rewards" a "recompensas"
        template: template
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  } catch (error) {
    console.error('Error al obtener recompensas de carnet:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: (error as Error).message
    });
  }
}

export default withAuth(handler);