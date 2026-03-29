import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { getExpirationConfig } from '@/lib/configHelpers';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
    const { id } = req.query;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'ID de carnet inválido' });
    }
    const petCards = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    if (!petCards || (petCards as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Carnet animal no encontrado' });
    }
    const petCard = (petCards as any[])[0];
    if (petCard.completed) {
      return res.status(400).json({ success: false, message: 'Este carnet ya está completado' });
    }
    if (petCard.stamps < 6) {
      return res.status(400).json({ success: false, message: 'Este carnet aún no tiene 6 sellos' });
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET completed = 1, updatedAt = ?, expirationDate = NULL, isExpired = 0
        WHERE id = ?
      `,
      values: [now, Number(id)]
    });
    const updatedPetCardsResult = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    const rawPetCard = (updatedPetCardsResult as any[])[0];
    
    // Obtener configuración de caducidad para calcular maxExpirationDate
    const expirationConfig = await getExpirationConfig();
    
    // Calcular maxExpirationDate (antigüedad máxima desde creación - no cambia al completar)
    let maxExpirationDate = null;
    if (rawPetCard.createdAt) {
      const createdDate = new Date(rawPetCard.createdAt);
      createdDate.setMonth(createdDate.getMonth() + expirationConfig.caducidad_carnet_antiguedad_meses);
      maxExpirationDate = createdDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Parsear stamp_dates si existe
    let parsedStampDates: string[] = [];
    try {
      if (rawPetCard.stamp_dates) {
        if (typeof rawPetCard.stamp_dates === 'string') {
          parsedStampDates = JSON.parse(rawPetCard.stamp_dates);
        } else if (Array.isArray(rawPetCard.stamp_dates)) {
          parsedStampDates = rawPetCard.stamp_dates;
        }
      }
    } catch (e) {
      console.error('Error parseando stamp_dates:', e);
    }
    
    const completedPetCard = {
      ...rawPetCard,
      stampDates: parsedStampDates,
      maxExpirationDate: maxExpirationDate
    };
    
    return res.status(200).json({
      success: true,
      message: 'Carnet completado correctamente',
      petCard: completedPetCard,
    });
  } catch (error) {
    console.error('Error al completar carnet:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);