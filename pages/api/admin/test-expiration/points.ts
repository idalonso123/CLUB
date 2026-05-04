import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { getExpirationConfig } from '@/lib/configHelpers';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar que el usuario es administrador
    const userRole = await req.user?.getRole();
    if (userRole !== 'administrador' && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso' });
    }

    // Obtener configuración de caducidad
    const expirationConfig = await getExpirationConfig();

    if (req.method === 'GET') {
      // Obtener puntos activos con información del usuario
      const points = await executeQuery({
        query: `
          SELECT 
            pc.id, 
            pc.persona_id, 
            pc.puntos, 
            pc.fecha_ingreso, 
            pc.fecha_caducidad, 
            pc.caducado,
            DATEDIFF(pc.fecha_caducidad, NOW()) as dias_hasta_caducidad,
            CONCAT(p.nombres, ' ', p.apellidos) as nombre
          FROM puntos_caducidad pc
          JOIN personas p ON pc.persona_id = p.codigo
          WHERE pc.caducado = 0
          ORDER BY pc.fecha_caducidad ASC
          LIMIT 20
        `
      });

      return res.status(200).json({ success: true, points });
    }

    if (req.method === 'POST') {
      const { action, id, days } = req.body;

      if (action === 'simulateExpired' && id && days !== undefined) {
        // Simular punto caducado
        await executeQuery({
          query: `
            UPDATE puntos_caducidad 
            SET fecha_caducidad = DATE_SUB(NOW(), INTERVAL ? DAY) 
            WHERE id = ?
          `,
          values: [days, id]
        });
        return res.status(200).json({ success: true, message: `Punto marcado como caducado hace ${days} día(s)` });
      }

      if (action === 'simulateExpiringSoon' && id && days !== undefined) {
        // Simular punto próximo a caducar
        await executeQuery({
          query: `
            UPDATE puntos_caducidad 
            SET fecha_caducidad = DATE_ADD(NOW(), INTERVAL ? DAY) 
            WHERE id = ?
          `,
          values: [days, id]
        });
        return res.status(200).json({ success: true, message: `Punto marcado para caducar en ${days} día(s)` });
      }

      if (action === 'reset' && id) {
        // Restaurar punto usando configuración dinámica
        const dias = expirationConfig.caducidad_puntos_meses * 30;
        await executeQuery({
          query: `
            UPDATE puntos_caducidad 
            SET fecha_caducidad = DATE_ADD(NOW(), INTERVAL ? DAY), caducado = 0 
            WHERE id = ?
          `,
          values: [dias, id]
        });
        return res.status(200).json({ success: true, message: `Punto restaurado a ${expirationConfig.caducidad_puntos_meses} meses` });
      }

      return res.status(400).json({ success: false, message: 'Acción no válida' });
    }

    return res.status(405).json({ success: false, message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API de puntos:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);
