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
      // Obtener carnets activos con días calculados usando configuración dinámica
      const petCards = await executeQuery({
        query: `
          SELECT *,
            DATEDIFF(expirationDate, NOW()) as dias_hasta_inactividad,
            DATEDIFF(DATE_ADD(createdAt, INTERVAL ? MONTH), NOW()) as dias_hasta_limite
          FROM pet_cards
          WHERE completed = 0
          ORDER BY createdAt DESC
          LIMIT 20
        `,
        values: [expirationConfig.caducidad_carnet_antiguedad_meses]
      });

      // Transformar los datos
      const transformedPetCards = (petCards as any[]).map(card => {
        let stampDates: string[] = [];
        try {
          if (card.stamp_dates) {
            if (typeof card.stamp_dates === 'string') {
              stampDates = JSON.parse(card.stamp_dates);
            } else if (Array.isArray(card.stamp_dates)) {
              stampDates = card.stamp_dates;
            }
          }
        } catch (e) {
          console.error('Error parseando stamp_dates:', e);
        }

        // Calcular maxExpirationDate usando configuración dinámica
        let maxExpirationDate = null;
        if (card.createdAt) {
          const createdDate = new Date(card.createdAt);
          createdDate.setMonth(createdDate.getMonth() + expirationConfig.caducidad_carnet_antiguedad_meses);
          maxExpirationDate = createdDate.toISOString().slice(0, 19).replace('T', ' ');
        }

        return {
          ...card,
          stampDates,
          maxExpirationDate
        };
      });

      return res.status(200).json({ success: true, petCards: transformedPetCards });
    }

    if (req.method === 'POST') {
      const { action, id, days, months } = req.body;

      if (action === 'simulateInactivity' && id && days !== undefined) {
        // Simular inactividad: RESTAR días de la fecha de expiración actual
        // Esto acerca la fecha de expiración, simulando que ha pasado tiempo sin actividad
        await executeQuery({
          query: `
            UPDATE pet_cards 
            SET expirationDate = DATE_SUB(expirationDate, INTERVAL ? DAY) 
            WHERE id = ?
          `,
          values: [days, id]
        });
        return res.status(200).json({ success: true, message: `Carnet marcado con ${days} día(s) de inactividad` });
      }

      if (action === 'simulateMaxLimit' && id && months !== undefined) {
        // Simular límite máximo usando configuración dinámica
        await executeQuery({
          query: `
            UPDATE pet_cards 
            SET createdAt = DATE_SUB(NOW(), INTERVAL ? MONTH) 
            WHERE id = ?
          `,
          values: [months, id]
        });
        return res.status(200).json({ success: true, message: `Carnet marcado con ${months} meses de edad` });
      }

      if (action === 'reset' && id) {
        // Restaurar carnet usando configuración dinámica
        await executeQuery({
          query: `
            UPDATE pet_cards 
            SET createdAt = NOW(), expirationDate = DATE_ADD(NOW(), INTERVAL ? MONTH), isExpired = 0 
            WHERE id = ?
          `,
          values: [expirationConfig.caducidad_carnet_inactividad_meses, id]
        });
        return res.status(200).json({ success: true, message: 'Carnet restaurado' });
      }

      return res.status(400).json({ success: false, message: 'Acción no válida' });
    }

    return res.status(405).json({ success: false, message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API de carnets:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);
