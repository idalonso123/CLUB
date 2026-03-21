import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }
    if (req.method !== 'POST') {
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
    if (petCard.stamps >= 6) {
      return res.status(400).json({ success: false, message: 'Este carnet ya tiene 6 sellos' });
    }
    // Asegurar que stampDates sea siempre un array válido
    let stampDates = [];
    try {
      if (petCard.stamp_dates) {
        if (typeof petCard.stamp_dates === 'string') {
          stampDates = JSON.parse(petCard.stamp_dates);
        } else if (Array.isArray(petCard.stamp_dates)) {
          stampDates = petCard.stamp_dates;
        }
      }
    } catch (e) {
      console.error('Error al parsear stamp_dates:', e);
      stampDates = [];
    }
    
    // Validar que stampDates sea un array
    if (!Array.isArray(stampDates)) {
      console.warn('stamp_dates no es un array, inicializando como array vacío');
      stampDates = [];
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    stampDates.push(now);
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET stamps = stamps + 1, stamp_dates = ?, updatedAt = ?
        WHERE id = ?
      `,
      values: [JSON.stringify(stampDates), now, Number(id)]
    });
    const updatedPetCardsResult = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    const rawPetCard = (updatedPetCardsResult as any[])[0];
    let parsedStampDates = [];
    try {
      if (rawPetCard.stamp_dates) {
        if (typeof rawPetCard.stamp_dates === 'string') {
          parsedStampDates = JSON.parse(rawPetCard.stamp_dates);
        } 
        else if (Array.isArray(rawPetCard.stamp_dates)) {
          parsedStampDates = rawPetCard.stamp_dates;
        }
      }
    } catch (e) {
      console.error('Error parseando stamp_dates:', e);
      parsedStampDates = [];
    }
    const transformedPetCard = {
      ...rawPetCard,
      stampDates: parsedStampDates
    };
    return res.status(200).json({
      success: true,
      message: 'Sello añadido correctamente',
      petCard: transformedPetCard,
    });
  } catch (error) {
    console.error('Error al añadir sello:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);