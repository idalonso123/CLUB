import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function redeemHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const { rewardId, shippingAddress, notes } = req.body;
    
    if (!rewardId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la recompensa'
      });
    }

    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });
    
    try {
      // 1. Verificar que la recompensa existe y está disponible
      const rewardResult = await executeQuery({
        query: `
          SELECT id, nombre, puntos, disponible, stock, canjeo_multiple, expiracion_activa, duracion_meses, cooldown_horas
          FROM recompensas 
          WHERE id = ?  
        `,
        values: [rewardId]
      });
      
      const rewards = rewardResult as any[];
      if (!rewards || rewards.length === 0) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(404).json({
          success: false,
          message: 'Recompensa no encontrada'
        });
      }
      
      const reward = rewards[0];
      
      // Verificar disponibilidad
      if (reward.disponible !== 1 || (reward.stock <= 0 && reward.stock !== -1)) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(400).json({
          success: false,
          message: 'Esta recompensa no está disponible actualmente'
        });
      }

      // Verificar si el usuario ya ha canjeado esta recompensa y si permite canjeo múltiple
      if (reward.canjeo_multiple !== 1) {
        const existingRedemptionResult = await executeQuery({
          query: `
            SELECT id FROM canjes_recompensas 
            WHERE persona_id = ? AND recompensa_id = ?
          `,
          values: [req.user.userId, rewardId]
        });
        
        const existingRedemptions = existingRedemptionResult as any[];
        if (existingRedemptions && existingRedemptions.length > 0) {
          await executeQuery({ query: 'ROLLBACK' });
          return res.status(400).json({
            success: false,
            message: 'Ya has canjeado esta recompensa anteriormente'
          });
        }
      } else {
        // Para recompensas con canjeo múltiple, verificar el cooldown configurado
        const existingRedemptionResult = await executeQuery({
          query: `
            SELECT fecha_canje FROM canjes_recompensas 
            WHERE persona_id = ? AND recompensa_id = ?
            ORDER BY fecha_canje DESC LIMIT 1
          `,
          values: [req.user.userId, rewardId]
        });
        
        const existingRedemptions = existingRedemptionResult as any[];
        if (existingRedemptions && existingRedemptions.length > 0) {
          const lastRedemptionDate = new Date(existingRedemptions[0].fecha_canje);
          const now = new Date();
          
          // Obtener el cooldown configurado para esta recompensa (por defecto 24 horas)
          const cooldownHoras = reward.cooldown_horas || 24;
          
          // Calcular la diferencia en horas
          const hoursSinceLastRedemption = (now.getTime() - lastRedemptionDate.getTime()) / (1000 * 60 * 60);
          
          // Verificar si han pasado menos horas que el cooldown configurado
          if (hoursSinceLastRedemption < cooldownHoras) {
            const hoursRemaining = Math.ceil(cooldownHoras - hoursSinceLastRedemption);
            await executeQuery({ query: 'ROLLBACK' });
            return res.status(400).json({
              success: false,
              message: `Debes esperar ${hoursRemaining} horas más para volver a canjear esta recompensa.`
            });
          }
        }
      }
      
      // 2. Verificar que el usuario tiene suficientes puntos
      const userPointsResult = await executeQuery({
        query: 'SELECT puntos FROM personas WHERE codigo = ?',
        values: [req.user.userId]
      });
      
      const users = userPointsResult as any[];
      if (!users || users.length === 0) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const userPoints = Number(users[0].puntos);
      const rewardPoints = Number(reward.puntos);
      console.log(userPoints, rewardPoints)
      if (userPoints < rewardPoints) {
        await executeQuery({ query: 'ROLLBACK' });
        return res.status(400).json({
          success: false,
          message: 'No tienes suficientes puntos para canjear esta recompensa'
        });
      }
      
      // 3. Reducir el stock de la recompensa solo si no es ilimitado (-1)
      if (reward.stock !== -1) {
        await executeQuery({
          query: 'UPDATE recompensas SET stock = stock - 1 WHERE id = ?',
          values: [rewardId]
        });
        
        // Si el stock llega a 0, marcar como no disponible
        if (reward.stock === 1) { // Después del update quedará en 0
          await executeQuery({
            query: 'UPDATE recompensas SET disponible = 0 WHERE id = ?',
            values: [rewardId]
          });
        }
      }
      
      // 4. Descontar puntos al usuario
      await executeQuery({
        query: 'UPDATE personas SET puntos = puntos - ? WHERE codigo = ?',
        values: [reward.puntos, req.user.userId]
      });
      
      // Calcular la fecha de expiración solo si la expiración está activa
      let fechaExpiracion = null;
      
      if (reward.expiracion_activa === 1) {
        const duracionMeses = reward.duracion_meses || 1; // Por defecto 1 mes si no está definido
        const fechaActual = new Date();
        fechaExpiracion = new Date(fechaActual);
        fechaExpiracion.setMonth(fechaExpiracion.getMonth() + duracionMeses);
      }
      
      // Función para generar códigos alfanuméricos aleatorios de 8 caracteres
      const generarCodigoAleatorio = () => {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        for (let i = 0; i < 8; i++) {
          codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return codigo;
      };
      
      // 5. Buscar todos los códigos de barras para esta recompensa
      let codigoBarras = null;
      let codigoVisible = null;
      
      const barcodeQuery = `
        SELECT id, codigo, descripcion
        FROM codigos_barras
        WHERE recompensa_id = ?
      `;

      const barcodeResult = await executeQuery({
        query: barcodeQuery,
        values: [rewardId]
      }) as any[];

      if (barcodeResult.length > 0) {
        // Seleccionar un código aleatorio de los disponibles
        const randomIndex = Math.floor(Math.random() * barcodeResult.length);
        codigoBarras = barcodeResult[randomIndex].codigo;
      } else {
        // No hay códigos predefinidos, generar uno aleatorio
        codigoBarras = generarCodigoAleatorio();
      }
      
      // Siempre generamos un código visible nuevo (diferente del código real)
      codigoVisible = generarCodigoAleatorio();
      
      // 6. Registrar el canje en la tabla de canjes con el código de barras
      const canjeResult = await executeQuery({
        query: `
          INSERT INTO canjes_recompensas 
          (persona_id, recompensa_id, puntos_canjeados, estado, direccion_envio, notas, codigo_barras_asignado, codigo_visible, fecha_canje, fecha_expiracion) 
          VALUES (?, ?, ?, 'pendiente', ?, ?, ?, ?, NOW(), ?)
        `,
        values: [
          req.user.userId,
          rewardId,
          reward.puntos,
          shippingAddress || null,
          notes || null,
          codigoBarras,
          codigoVisible,
          fechaExpiracion
        ]
      });
      
      const canjeId = (canjeResult as any).insertId;
      
      // 6. Registrar en el historial de puntos
      await executeQuery({
        query: `
          INSERT INTO logs_points 
          (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          'canje_recompensa',
          req.user.userId,  // actor_id (el propio usuario realiza la acción)
          req.user.userId,  // persona_id (usuario que canjea los puntos)
          -reward.puntos,   // puntos (negativo porque se restan)
          userPoints,       // puntos_previos
          userPoints - reward.puntos, // puntos_nuevos
          `Canje de recompensa: ${reward.nombre}`
        ]
      });
      
      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });
      
      return res.status(200).json({
        success: true,
        message: 'Recompensa canjeada con éxito',
        redemption: {
          id: canjeId,
          rewardId: rewardId,
          rewardName: reward.nombre,
          pointsSpent: reward.puntos,
          remainingPoints: userPoints - reward.puntos,
          status: 'pendiente',
          date: new Date(),
          expirationDate: fechaExpiracion,
          hasExpiration: reward.expiracion_activa === 1,
          codigoBarras: codigoBarras,
          codigoVisible: codigoVisible
        }
      });
      
    } catch (error) {
      // Revertir cambios en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error al canjear recompensa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al canjear recompensa',
      error: (error as Error).message
    });
  }
}

export default withAuth(redeemHandler);
