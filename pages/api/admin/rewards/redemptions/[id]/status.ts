import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function updateRedemptionStatusHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador
  const userRole = await req.user?.getRole();
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

  const { id } = req.query;
  const { status, notes } = req.body;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de canje no válido'
    });
  }

  if (!status || !['pendiente', 'completado', 'cancelado', 'expirado'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Estado no válido. Debe ser: pendiente, completado, cancelado o expirado'
    });
  }

  try {
    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });

    try {
      // Verificar que el canje existe y obtener información de expiración
      const redemptionResult = await executeQuery({
        query: `
          SELECT cr.id, cr.persona_id, cr.recompensa_id, cr.puntos_canjeados, cr.estado,
                 cr.fecha_expiracion, r.expiracion_activa,
                 p.puntos as user_points, r.nombre as reward_name
          FROM canjes_recompensas cr
          JOIN personas p ON cr.persona_id = p.codigo
          JOIN recompensas r ON cr.recompensa_id = r.id
          WHERE cr.id = ?
        `,
        values: [id]
      });

      const redemptions = redemptionResult as any[];
      if (redemptions.length === 0) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(404).json({
          success: false,
          message: 'Canje no encontrado'
        });
      }

      const redemption = redemptions[0];
      const previousStatus = redemption.estado;

      // Si no hay cambio de estado, solo añadimos notas
      if (previousStatus === status) {
        if (notes) {
          await executeQuery({
            query: 'UPDATE canjes_recompensas SET notas = CONCAT(IFNULL(notas, ""), ?\n) WHERE id = ?',
            values: [`\n[${new Date().toISOString()}] ${notes}`, id]
          });
        }
        
        await executeQuery({ query: 'COMMIT' });
        
        return res.status(200).json({
          success: true,
          message: 'Notas actualizadas correctamente',
          status: status
        });
      }
      
      // Verificar si la recompensa ha expirado
      if (status === 'completado' && redemption.expiracion_activa === 1 && redemption.fecha_expiracion) {
        const fechaExpiracion = new Date(redemption.fecha_expiracion);
        const ahora = new Date();
        
        if (fechaExpiracion < ahora) {
          await executeQuery({ query: 'ROLLBACK' });
          return res.status(400).json({
            success: false,
            message: 'No se puede marcar como entregada una recompensa que ya ha expirado',
            status: 'expirado'
          });
        }
      }

      // Si se cancela un canje que estaba pendiente o completado, devolver puntos
      if (status === 'cancelado' && (previousStatus === 'pendiente' || previousStatus === 'completado')) {
        // Devolver puntos al usuario
        await executeQuery({
          query: 'UPDATE personas SET puntos = puntos + ? WHERE codigo = ?',
          values: [redemption.puntos_canjeados, redemption.persona_id]
        });

        // Registrar en historial de puntos
        await executeQuery({
          query: `
            INSERT INTO logs_points 
            (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `,
          values: [
            'devolucion_canje',
            req.user?.userId || 0, // Añadido operador opcional y valor por defecto
            redemption.persona_id,
            redemption.puntos_canjeados, // Puntos devueltos (positivo)
            redemption.user_points,
            redemption.user_points + redemption.puntos_canjeados,
            `Cancelación de canje: ${redemption.reward_name}`
          ]
        });
      }

      // Actualizar el estado del canje
      await executeQuery({
        query: 'UPDATE canjes_recompensas SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
        values: [status, id]
      });

      // Si hay notas, actualizarlas también
      if (notes) {
        await executeQuery({
          query: 'UPDATE canjes_recompensas SET notas = CONCAT(IFNULL(notas, ""), ?\n) WHERE id = ?',
          values: [`\n[${new Date().toISOString()}] ${notes}`, id]
        });
      }

      // Registrar en logs_rewards en lugar de logs_admin
      await executeQuery({
        query: `
          INSERT INTO logs_rewards 
          (user_id, action, reward_id, details, created_at) 
          VALUES (?, 'update', ?, ?, NOW())
        `,
        values: [
          req.user ? req.user.userId : 0, // Verificar que req.user exista antes de acceder a userId
          redemption.recompensa_id,  // Usar el id de la recompensa relacionada con el canje
          JSON.stringify({
            redemptionId: id,
            previousStatus,
            newStatus: status,
            notes: notes || null
          })
        ]
      });

      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });

      return res.status(200).json({
        success: true,
        message: `Estado del canje actualizado a: ${status}`,
        status: status,
        pointsRefunded: status === 'cancelado' ? redemption.puntos_canjeados : 0
      });

    } catch (error) {
      // Revertir transacción en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar estado del canje:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del canje',
      error: (error as Error).message
    });
  }
}

export default withAuth(updateRedemptionStatusHandler);
