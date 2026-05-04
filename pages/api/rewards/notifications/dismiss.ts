import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

/**
 * PUT /api/rewards/notifications/dismiss
 * Descarta una o varias notificaciones de recompensa desbloqueada
 * Body: { notificationId: number } O { notificationIds: number[] }
 * 
 * Cuando el usuario cierra el modal, se marca la notificación como vista
 * y descartada para que no vuelva a aparecer.
 */
async function dismissNotificationHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  try {
    const { notificationId, notificationIds } = req.body;

    // Soportar tanto un solo ID como un array de IDs
    let idsToDismiss: number[] = [];
    
    if (notificationIds && Array.isArray(notificationIds)) {
      // Es un array de IDs
      idsToDismiss = notificationIds.map(id => Number(id)).filter(id => !isNaN(id));
    } else if (notificationId) {
      // Es un solo ID
      const singleId = Number(notificationId);
      if (isNaN(singleId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de notificación inválido'
        });
      }
      idsToDismiss = [singleId];
    }

    if (idsToDismiss.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún ID de notificación'
      });
    }

    console.log('[dismissNotificationHandler] IDs a descartar:', idsToDismiss);

    // Marcar todas como vistas y descartadas
    const placeholders = idsToDismiss.map(() => '?').join(', ');
    await executeQuery({
      query: `
        UPDATE user_reward_notifications 
        SET seen_at = NOW(), dismissed_at = NOW()
        WHERE id IN (${placeholders}) AND user_id = ?
      `,
      values: [...idsToDismiss, req.user.userId]
    });

    return res.status(200).json({
      success: true,
      message: `${idsToDismiss.length} notificación(es) descartada(s) correctamente`
    });

  } catch (error) {
    console.error('Error al descartar notificación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al descartar notificación',
      error: (error as Error).message
    });
  }
}

export default withAuth(dismissNotificationHandler);