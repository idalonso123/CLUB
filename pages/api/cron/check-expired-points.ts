import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
  try {
    const expiredPointsResult = await executeQuery({
      query: `
        SELECT pc.id, pc.persona_id, pc.puntos, p.puntos as puntos_actuales
        FROM puntos_caducidad pc
        JOIN personas p ON pc.persona_id = p.codigo
        WHERE pc.fecha_caducidad < NOW() 
        AND pc.caducado = 0
      `,
      values: [],
    }) as Array<{ id: number, persona_id: number, puntos: number, puntos_actuales: number }>;
    if (!expiredPointsResult || expiredPointsResult.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No hay puntos caducados pendientes de procesar',
        processed: 0
      });
    }
    for (const expiredPoint of expiredPointsResult) {
      const { id, persona_id, puntos, puntos_actuales } = expiredPoint;
      const nuevosPuntos = Math.max(0, puntos_actuales - puntos);
      await executeQuery({
        query: 'UPDATE personas SET puntos = ? WHERE codigo = ?',
        values: [nuevosPuntos, persona_id],
      });
      await executeQuery({
        query: 'UPDATE puntos_caducidad SET caducado = 1 WHERE id = ?',
        values: [id],
      });
      await executeQuery({
        query: `
          INSERT INTO logs_points 
          (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          'Caducidad',
          0, 
          persona_id,
          -puntos,
          puntos_actuales,
          nuevosPuntos,
          'Puntos caducados automáticamente por el sistema',
        ],
      });
    }
    return res.status(200).json({ 
      success: true, 
      message: 'Puntos caducados procesados correctamente',
      processed: expiredPointsResult.length
    });
  } catch (error) {
    console.error('Error al procesar puntos caducados:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al procesar puntos caducados',
      error: (error as Error).message 
    });
  }
}
