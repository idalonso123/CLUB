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
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
      }
      const petCardsResult = await executeQuery({
        query: `
          SELECT * FROM pet_cards
          WHERE userId = ?
          ORDER BY completed ASC, updatedAt DESC
        `,
        values: [Number(userId)]
      });
      const petCards = (petCardsResult as any[]).map(card => {
        let stampDates = [];
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
        return {
          ...card,
          stampDates: stampDates
        };
      });
      return res.status(200).json({ success: true, petCards });
    }
    if (req.method === 'POST') {
      const { userId, petName, petType, productName } = req.body;
      if (!userId || !petName || !petType || !productName) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
      }
      const users = await executeQuery({
        query: `SELECT * FROM personas WHERE codigo = ?`,
        values: [userId]
      });
      if (!users || (users as any[]).length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      // Inicializar stamp_dates como un array vacío en formato JSON
      const emptyStampDates = JSON.stringify([]);
      const result = await executeQuery({
        query: `
          INSERT INTO pet_cards (userId, petName, petType, productName, stamps, completed, createdAt, updatedAt, stamp_dates)
          VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)
        `,
        values: [userId, petName, petType, productName, now, now, emptyStampDates]
      });
      const insertId = (result as any).insertId;
      const newPetCard = await executeQuery({
        query: `SELECT * FROM pet_cards WHERE id = ?`,
        values: [insertId]
      });
      return res.status(201).json({
        success: true,
        message: 'Carnet animal creado correctamente',
        petCard: (newPetCard as any[])[0],
      });
    }
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API de carnets animales:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);