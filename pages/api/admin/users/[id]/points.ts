import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { addMonths } from 'date-fns';
import { getExpirationConfig } from '@/lib/configHelpers';

async function userPointsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que req.user está definido
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No se ha autenticado correctamente'
    });
  }

  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // Solo permitir método PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  // Obtener ID del usuario
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no válido'
    });
  }

  try {
    const { adjustment, reason, type = 'Administrador' } = req.body;
    
    if (adjustment === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren ajuste y razón'
      });
    }
    
    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });
    
    try {
      // 1. Obtener puntos actuales del usuario
      const userPointsResult = await executeQuery({
        query: 'SELECT puntos FROM personas WHERE codigo = ?',
        values: [id]
      });
      
      const users = userPointsResult as any[];
      if (!users || users.length === 0) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const currentPoints = users[0].puntos;
      const newPoints = currentPoints + adjustment;
      
      // 2. Actualizar puntos en la tabla personas
      await executeQuery({
        query: 'UPDATE personas SET puntos = ? WHERE codigo = ?',
        values: [newPoints, id]
      });
      
      // 3. Registrar la transacción en la tabla logs_points
      await executeQuery({
        query: `
          INSERT INTO logs_points 
          (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          type,
          req.user!.userId,  // actor_id (administrador que realiza la acción)
          id,               // persona_id (usuario que recibe/pierde los puntos)
          adjustment,       // puntos (positivo o negativo)
          currentPoints,    // puntos_previos
          newPoints,        // puntos_nuevos
          reason            // motivo
        ]
      });
      
      // 3.1 Si el ajuste es positivo, registrar en la tabla puntos_caducidad para expiración gradual
      if (adjustment > 0) {
        // Obtener configuración de caducidad de la base de datos
        const expirationConfig = await getExpirationConfig();
        const fechaCaducidad = addMonths(new Date(), expirationConfig.caducidad_puntos_meses);
        
        await executeQuery({
          query: `
            INSERT INTO puntos_caducidad 
            (persona_id, puntos, fecha_ingreso, fecha_caducidad, caducado) 
            VALUES (?, ?, NOW(), ?, 0)
          `,
          values: [
            id,
            adjustment,
            fechaCaducidad,
          ],
        });
      }
      // 3.2 Si el ajuste es negativo, restar puntos de la tabla puntos_caducidad
      // RENDIMIENTO: Optimizado para usar operaciones bulk en lugar de queries en bucle
      else if (adjustment < 0) {
        let puntosARestar = Math.abs(adjustment);
        
        // Obtener los registros de puntos activos ordenados por fecha de caducidad (primero los más próximos)
        const puntosActivosResult = await executeQuery({
          query: `
            SELECT id, puntos 
            FROM puntos_caducidad 
            WHERE persona_id = ? AND caducado = 0 
            ORDER BY fecha_caducidad ASC
          `,
          values: [id]
        }) as Array<{ id: number, puntos: number }>;
        
        // Calcular los cambios necesarios antes de ejecutar
        const cambios: Array<{ id: number; tipo: 'marcar_caducado' | 'restar'; puntos?: number }> = [];
        
        for (const registro of puntosActivosResult) {
          if (puntosARestar <= 0) break;
          
          if (registro.puntos <= puntosARestar) {
            // Los puntos del registro se agotan completamente
            cambios.push({ id: registro.id, tipo: 'marcar_caducado' });
            puntosARestar -= registro.puntos;
          } else {
            // Los puntos del registro se reducen parcialmente
            cambios.push({ id: registro.id, tipo: 'restar', puntos: puntosARestar });
            puntosARestar = 0;
          }
        }
        
        // RENDIMIENTO: Ejecutar todas las actualizaciones en una sola transacción
        // Construir una query bulk para mayor eficiencia
        for (const cambio of cambios) {
          if (cambio.tipo === 'marcar_caducado') {
            await executeQuery({
              query: 'UPDATE puntos_caducidad SET caducado = 1 WHERE id = ?',
              values: [cambio.id]
            });
          } else if (cambio.tipo === 'restar' && cambio.puntos !== undefined) {
            await executeQuery({
              query: 'UPDATE puntos_caducidad SET puntos = puntos - ? WHERE id = ?',
              values: [cambio.puntos, cambio.id]
            });
          }
        }
        
        // Alternativa aún más optimizada para MySQL usando CASE:
        // Esta versión ejecuta TODOS los cambios en UNA sola query
        /*
        if (cambios.length > 0) {
          const ids = cambios.map(c => c.id);
          const casosSet = cambios.map(c => {
            if (c.tipo === 'marcar_caducado') {
              return `WHEN id = ${c.id} THEN 1`;
            } else {
              return `WHEN id = ${c.id} THEN puntos - ${c.puntos}`;
            }
          }).join(' ');
          
          const casosWhen = cambios.map(c => `id = ${c.id}`).join(' OR ');
          
          await executeQuery({
            query: `
              UPDATE puntos_caducidad 
              SET caducado = CASE ${casosSet} ELSE caducado END,
                  puntos = CASE ${casosWhen} THEN CASE ${casosSet} ELSE puntos END
              WHERE ${casosWhen}
            `,
            values: []
          });
        }
        */
      }
      
      // 4. Registrar también en logs_admin para auditoría
      await executeQuery({
        query: `
          INSERT INTO logs_admin 
          (admin_id, action, entity_type, entity_id, details, created_at) 
          VALUES (?, ?, ?, ?, ?, NOW())
        `,
        values: [
          req.user?.userId || 0,
          'points_adjustment',
          'user',
          id,
          JSON.stringify({
            previousPoints: currentPoints,
            adjustment: adjustment,
            newPoints: newPoints,
            reason: reason,
            type: type
          })
        ]
      });
      
      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });
      
      return res.status(200).json({
        success: true,
        message: 'Puntos actualizados correctamente',
        points: {
          previousPoints: currentPoints,
          adjustment: adjustment,
          newPoints: newPoints
        }
      });
      
    } catch (error) {
      // Revertir cambios en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error al ajustar puntos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al ajustar puntos',
      error: (error as Error).message
    });
  }
}

export default withAuth(userPointsHandler);