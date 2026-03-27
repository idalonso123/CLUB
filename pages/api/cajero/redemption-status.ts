import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function changeRedemptionStatusHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (req.method !== "PATCH") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const { redemptionId, status, notes } = req.body;
  if (!redemptionId || !status) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  // Verificar si es una reversión y si el usuario es administrador
  if (status === "pendiente") {
    if (userRole !== "administrador" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden revertir recompensas completadas",
      });
    }
  }

  // Mapear valores amigables a los valores válidos del ENUM de la base de datos
  const allowedStatuses = ["pendiente", "completado", "cancelado", "expirado"];
  let dbStatus = status;
  if (status === "entregado" || status === "finalizado") dbStatus = "completado";

  if (!allowedStatuses.includes(dbStatus)) {
    return res.status(400).json({ success: false, message: "Estado no permitido" });
  }

  try {
    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });
    
    try {
      // Obtener información del canje actual para saber los puntos a devolver
      if (dbStatus === "cancelado") {
        // 1. Obtenemos los detalles del canje
        const redemptionResult = await executeQuery({
          query: `
            SELECT cr.id, cr.persona_id, cr.recompensa_id, cr.puntos_canjeados, cr.estado, r.stock
            FROM canjes_recompensas cr
            JOIN recompensas r ON cr.recompensa_id = r.id
            WHERE cr.id = ?
          `,
          values: [redemptionId]
        });
        
        const redemptions = redemptionResult as any[];
        if (!redemptions || redemptions.length === 0) {
          await executeQuery({ query: 'ROLLBACK' });
          return res.status(404).json({ success: false, message: "Canje no encontrado" });
        }
        
        const redemption = redemptions[0];
        
        // Solo procesar la cancelación si el estado actual no es ya 'cancelado'
        if (redemption.estado !== "cancelado") {
          // 2. Devolver los puntos al usuario
          await executeQuery({
            query: 'UPDATE personas SET puntos = puntos + ? WHERE codigo = ?',
            values: [redemption.puntos_canjeados, redemption.persona_id]
          });
          
          // 3. Aumentar el stock de la recompensa solo si no es ilimitado (-1)
          if (redemption.stock !== -1) {
            await executeQuery({
              query: 'UPDATE recompensas SET stock = stock + 1 WHERE id = ?',
              values: [redemption.recompensa_id]
            });
          }
          
          // 4. Registrar en el historial de puntos
          // Obtener puntos actuales del usuario
          const userPointsResult = await executeQuery({
            query: 'SELECT puntos FROM personas WHERE codigo = ?',
            values: [redemption.persona_id]
          });
          
          const users = userPointsResult as any[];
          if (users && users.length > 0) {
            const currentPoints = users[0].puntos;
            
            await executeQuery({
              query: `
                INSERT INTO logs_points 
                (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
              `,
              values: [
                'devolucion_recompensa',
                req.user?.userId,  // actor_id (el usuario que realiza la acción)
                redemption.persona_id,  // persona_id (usuario que recibe los puntos)
                redemption.puntos_canjeados,  // puntos (positivo porque se devuelven)
                currentPoints - redemption.puntos_canjeados,  // puntos_previos
                currentPoints,  // puntos_nuevos
                `Devolución de recompensa (ID: ${redemption.recompensa_id})`
              ]
            });
          }
        }
      }
      
      // Verificar si la recompensa ha expirado antes de marcarla como completada
      if (dbStatus === "completado") {
        const expirationResult = await executeQuery({
          query: `
            SELECT fecha_expiracion, expiracion_activa 
            FROM canjes_recompensas cr
            JOIN recompensas r ON cr.recompensa_id = r.id
            WHERE cr.id = ?
          `,
          values: [redemptionId]
        });
        
        const expirationData = expirationResult as any[];
        if (expirationData && expirationData.length > 0) {
          const { fecha_expiracion, expiracion_activa } = expirationData[0];
          
          if (expiracion_activa === 1 && fecha_expiracion) {
            const fechaExpiracion = new Date(fecha_expiracion);
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
        }
      }
      
      // 5. Actualizar estado del canje
      await executeQuery({
        query: "UPDATE canjes_recompensas SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?",
        values: [dbStatus, redemptionId]
      });
      
      // 6. Añadir notas si se proporcionan
      if (notes) {
        await executeQuery({
          query: "UPDATE canjes_recompensas SET notas = CONCAT(IFNULL(notas, ''), ? ,'\n') WHERE id = ?",
          values: [`[${new Date().toISOString().slice(0, 19).replace('T', ' ')}] ${notes}`, redemptionId]
        });
      }
      
      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });
      
      return res.status(200).json({ 
        success: true, 
        message: dbStatus === "cancelado" ? "Recompensa cancelada y puntos devueltos" : "Estado actualizado" 
      });
    } catch (error) {
      // Revertir cambios en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el estado",
      error: (error as Error).message,
    });
  }
}

export default withAuth(changeRedemptionStatusHandler);
