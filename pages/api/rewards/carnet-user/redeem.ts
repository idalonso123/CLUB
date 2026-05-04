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

    // POST: Canjear una recompensa de carnet
    if (req.method === 'POST') {
      const userId = req.user.userId;
      const { recompensaId } = req.body;

      if (!recompensaId) {
        return res.status(400).json({
          success: false,
          message: 'ID de recompensa requerido'
        });
      }

      // Verificar que la recompensa existe y pertenece al usuario
      const rewardResult = await executeQuery({
        query: `
          SELECT 
            rcm.id,
            rcm.user_id AS userId,
            rcm.pet_card_id AS petCardId,
            rcm.product_nombre AS productNombre,
            rcm.product_barcode AS productBarcode,
            rcm.pet_name AS petName,
            rcm.pet_type AS petType,
            rcm.canjeada,
            rcm.fecha_expiracion AS fechaExpiracion
          FROM recompensas_carnet_mascota rcm
          WHERE rcm.id = ? AND rcm.user_id = ?
        `,
        values: [recompensaId, userId]
      }) as any[];

      if (!rewardResult || rewardResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recompensa no encontrada'
        });
      }

      const reward = rewardResult[0];

      // Verificar si ya fue canjeada
      if (reward.canjeada) {
        return res.status(400).json({
          success: false,
          message: 'Esta recompensa ya ha sido canjeada'
        });
      }

      // Verificar si ha expirado
      if (reward.fechaExpiracion) {
        const expDate = new Date(reward.fechaExpiracion);
        if (expDate < new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Esta recompensa ha expirado'
          });
        }
      }

      // Marcar la recompensa como canjeada
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await executeQuery({
        query: `
          UPDATE recompensas_carnet_mascota 
          SET canjeada = 1, fecha_usada = ?
          WHERE id = ?
        `,
        values: [now, recompensaId]
      });

      // Registrar en el historial de canjes de recompensas
      // Usar las columnas que existen en la tabla historial_carnets_mascota
      await executeQuery({
        query: `
          INSERT INTO historial_carnets_mascota 
          (persona_id, carnet_id, nombre_mascota, tipo_mascota, nombre_pienso, codigo_barras_producto, fecha_completado, fecha_canje)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          userId,
          reward.petCardId,
          reward.petName || '',
          reward.petType || '',
          reward.productNombre,
          reward.productBarcode || null,
          now, // fecha_completado
          now  // fecha_canje
        ]
      });

      console.log(`Recompensa de carnet canjeada: Usuario ${userId}, Producto: ${reward.productNombre}`);

      return res.status(200).json({
        success: true,
        message: 'Recompensa canjeada correctamente',
        redemption: {
          id: recompensaId,
          productNombre: reward.productNombre,
          productBarcode: reward.productBarcode,
          fechaCanje: now
        }
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  } catch (error) {
    console.error('Error al canjear recompensa de carnet:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: (error as Error).message
    });
  }
}

export default withAuth(handler);
