import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function redemptionHistoryHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  // Si se pasa userId y el requester es cajero/admin, mostrar historial de ese usuario
  const { userId } = req.query;
  let personaId = req.user?.userId;

  // Solo permitir que admin/cajero consulten el historial de otro usuario
  if (userId && userId !== String(personaId)) {
    const role = await req.user?.getRole?.();
    if (role && ["admin", "administrador", "cajero"].includes(role)) {
      personaId = Number(userId);
    } else {
      // No permitir acceso a historial de otro usuario si no es admin/cajero
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver el historial de este usuario'
      });
    }
  }

  if (!personaId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  try {
    // Primero, verificamos si hay recompensas que han expirado pero aún no están marcadas como expiradas
    // Solo verificamos las que tienen fecha de expiración (las que tienen expiración activa)
    const updateExpiredQuery = `
      UPDATE canjes_recompensas cr
      JOIN recompensas r ON cr.recompensa_id = r.id
      SET cr.estado = 'expirado', cr.fecha_actualizacion = NOW() 
      WHERE cr.persona_id = ? 
        AND cr.estado = 'pendiente' 
        AND r.expiracion_activa = 1
        AND cr.fecha_expiracion IS NOT NULL 
        AND cr.fecha_expiracion < NOW()
    `;
    
    await executeQuery({
      query: updateExpiredQuery,
      values: [personaId]
    });
    
    // Ahora obtenemos el historial incluyendo la información de expiración y códigos de barras
    const query = `
      SELECT 
        cr.id,
        cr.recompensa_id AS rewardId,
        r.nombre AS rewardName,
        r.imagen_url AS imageUrl,
        r.categoria AS category,
        cr.puntos_canjeados AS pointsSpent,
        cr.estado AS status,
        cr.fecha_canje AS redemptionDate,
        cr.fecha_expiracion AS expirationDate,
        cr.fecha_actualizacion AS lastUpdated,
        r.expiracion_activa AS hasExpiration,
        cr.codigo_barras_asignado AS codigoBarras,
        cr.codigo_visible AS codigoVisible,
        CASE 
          WHEN cr.estado = 'expirado' THEN 1
          WHEN cr.estado = 'pendiente' AND r.expiracion_activa = 1 AND cr.fecha_expiracion < NOW() THEN 1
          ELSE 0
        END AS isExpired
      FROM canjes_recompensas cr
      JOIN recompensas r ON cr.recompensa_id = r.id
      WHERE cr.persona_id = ?
      ORDER BY cr.fecha_canje DESC
    `;

    const redemptions = await executeQuery({
      query,
      values: [personaId]
    });

    return res.status(200).json({
      success: true,
      redemptions
    });
    
  } catch (error) {
    console.error('Error al obtener historial de canjes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial de canjes',
      error: (error as Error).message
    });
  }
}

export default withAuth(redemptionHistoryHandler);
