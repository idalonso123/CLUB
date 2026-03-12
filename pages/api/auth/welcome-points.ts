import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { addYears } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, points = 5 } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID del usuario' });
    }

    const userResult = await executeQuery({
      query: 'SELECT * FROM personas WHERE codigo = ?',
      values: [userId],
    }) as any[];

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    

    const currentPoints = userResult[0].puntos || 0;
    const newPoints = currentPoints + points;

    await executeQuery({ query: 'START TRANSACTION' });

    try {
      const updateResult = await executeQuery({
        query: 'UPDATE personas SET puntos = ? WHERE codigo = ?',
        values: [newPoints, userId]
      });

      try {
        await executeQuery({
          query: `
            INSERT INTO logs_points 
            (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `,
          values: [
            'Sistema',
            userId,         
            userId,       
            points,       
            currentPoints,  
            newPoints,       
            'Puntos de bienvenida para nuevo usuario' 
          ]
        });
      } catch (error) {
        console.error('[welcome-points] Error al registrar en logs_points:', error);
      }

      const fechaCaducidad = addYears(new Date(), 1);
      
      try {
        await executeQuery({
          query: `
            INSERT INTO puntos_caducidad 
            (persona_id, puntos, fecha_ingreso, fecha_caducidad, caducado) 
            VALUES (?, ?, NOW(), ?, 0)
          `,
          values: [
            userId,
            points,
            fechaCaducidad,
          ],
        });
      } catch (error) {
        console.error('[welcome-points] Error al registrar en puntos_caducidad:', error);
      }

      await executeQuery({ query: 'COMMIT' });

      return res.status(200).json({
        success: true,
        message: 'Puntos de bienvenida añadidos correctamente',
        points: {
          previousPoints: currentPoints,
          added: points,
          newPoints: newPoints
        }
      });
    } catch (error) {
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('[welcome-points] Error al añadir puntos de bienvenida:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al añadir puntos de bienvenida',
      error: (error as Error).message
    });
  }
}
