import { NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { getExpirationConfig } from '@/lib/configHelpers';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    // Obtener configuración de caducidad
    const expirationConfig = await getExpirationConfig();
    
    const petCards = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE userId = ? ORDER BY completed ASC, createdAt DESC`,
      values: [userId]
    });
    const transformedPetCards = (petCards as any[]).map(card => {
      let stampDates: string[] = [];
      try {
        if (card.stamp_dates) {
          if (typeof card.stamp_dates === 'string') {
            stampDates = JSON.parse(card.stamp_dates);
          } 
          else if (Array.isArray(card.stamp_dates)) {
            stampDates = card.stamp_dates;
          }
        }
      } catch (e) {
        console.error('Error parseando stamp_dates:', e);
        stampDates = [];
      }
      
      // Calcular fecha máxima de caducidad usando configuración dinámica
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
    return res.status(200).json({
      success: true,
      petCards: transformedPetCards
    });
  } catch (error) {
    console.error('Error al obtener carnets de mascotas:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);