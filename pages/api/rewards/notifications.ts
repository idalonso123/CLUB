import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

/**
 * GET /api/rewards/notifications
 * Obtiene las recompensas desbloqueadas no vistas para el usuario actual
 * 
 * Response: {
 *   success: boolean,
 *   notifications: [{
 *     id: number,
 *     reward_id: number,
 *     reward_name: string,
 *     reward_description: string,
 *     reward_image_url: string,
 *     reward_points: number,
 *     unlocked_at: string (datetime)
 *   }]
 * }
 */
async function getNotificationsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    // Obtener notificaciones no vistas y no descartadas con info de la recompensa
    const notifications = await executeQuery({
      query: `
        SELECT 
          urn.id,
          urn.reward_id,
          urn.unlocked_at,
          r.nombre as reward_name,
          r.descripcion as reward_description,
          r.imagen_url as reward_image_url,
          r.puntos as reward_points
        FROM user_reward_notifications urn
        INNER JOIN recompensas r ON urn.reward_id = r.id
        WHERE urn.user_id = ?
          AND urn.seen_at IS NULL
          AND urn.dismissed_at IS NULL
        ORDER BY urn.unlocked_at DESC
      `,
      values: [req.user.userId]
    }) as any[];

    // Formatear fechas para ISO string
    const formattedNotifications = notifications.map(n => ({
      ...n,
      unlocked_at: n.unlocked_at ? new Date(n.unlocked_at).toISOString() : null
    }));

    return res.status(200).json({
      success: true,
      notifications: formattedNotifications
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: (error as Error).message
    });
  }
}

export default withAuth(getNotificationsHandler);