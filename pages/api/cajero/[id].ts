import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { addMonths } from "date-fns";
import { getExpirationConfig } from "@/lib/configHelpers";
import { SacoBarrasItem } from "@/types/teller";

interface SacoBarrasAPI {
  codigoBarras: string;
  pvp: number;
  petCardId: number;
  petName: string;
}

/**
 * Detecta y crea notificaciones para recompensas que se acaban de desbloquear
 *Llama a este método después de actualizar los puntos del usuario
 */
async function checkAndCreateRewardNotifications(userId: number, previousPoints: number, newPoints: number) {
  try {
    // Obtener todas las recompensas de puntos disponibles que requieren puntos <= nuevos puntos
    // y verificar si ya fueron canjeadas o no están disponibles
    const availableRewards = await executeQuery({
      query: `
        SELECT r.id, r.nombre, r.puntos, r.imagen_url, r.descripcion
        FROM recompensas r
        WHERE r.disponible = 1 
          AND r.tipo_recompensa != 'carnet'
          AND (r.stock > 0 OR r.stock = -1)
          AND r.puntos <= ?
          AND r.puntos > ?
      `,
      values: [newPoints, previousPoints]
    }) as any[];

    if (!availableRewards || availableRewards.length === 0) {
      return;
    }

    // Obtener recompensas ya canjeadas por el usuario (para filtrar)
    const redeemedRewards = await executeQuery({
      query: `
        SELECT recompensa_id FROM canjes_recompensas 
        WHERE persona_id = ? AND estado != 'cancelado'
      `,
      values: [userId]
    }) as any[];
    
    const redeemedIds = redeemedRewards.map((r: any) => r.recompensa_id);

    // Filtrar recompensas que el usuario NO ha canjeado todavía
    // y que no tienen notificación activa ya creada
    const rewardsToNotify = [];
    
    for (const reward of availableRewards) {
      // Verificar si la recompensa permite canjeo múltiple
      const rewardCheck = await executeQuery({
        query: 'SELECT canjeo_multiple FROM recompensas WHERE id = ?',
        values: [reward.id]
      }) as any[];
      
      const permiteCanjeMultiple = rewardCheck && rewardCheck.length > 0 && rewardCheck[0].canjeo_multiple === 1;
      
      // Saltar si ya fue canjeada Y no permite canjeo múltiple
      if (redeemedIds.includes(reward.id) && !permiteCanjeMultiple) {
        continue;
      }

      // Para recompensas de canjeo múltiple: SIEMPRE crear notificación cuando se desbloquean
      // Para recompensas de canje único: solo crear si no existe una notificación activa
      if (permiteCanjeMultiple) {
        // Para canje múltiple: crear notificación siempre (cada vez que se desbloquea)
        rewardsToNotify.push(reward);
      } else {
        // Para canje único: verificar si ya existe una notificación activa
        const existingNotification = await executeQuery({
          query: `
            SELECT id FROM user_reward_notifications 
            WHERE user_id = ? AND reward_id = ? AND dismissed_at IS NULL
          `,
          values: [userId, reward.id]
        }) as any[];

        if (existingNotification && existingNotification.length === 0) {
          rewardsToNotify.push(reward);
        }
      }
    }

    // Crear notificaciones para las recompensas desbloqueadas
    for (const reward of rewardsToNotify) {
      await executeQuery({
        query: `
          INSERT INTO user_reward_notifications (user_id, reward_id, unlocked_at)
          VALUES (?, ?, NOW())
        `,
        values: [userId, reward.id]
      });
      console.log(`Notificación creada para usuario ${userId}: Recompensa "${reward.nombre}" desbloqueada`);
    }

  } catch (error) {
    console.error('Error al crear notificaciones de recompensas:', error);
    // No lanzar error para no afectar la operación principal
  }
}

async function addBalanceHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo admin o cajero
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const { id } = req.query;
  const { amount, puntos, isCarnetAnimal, sacos } = req.body;

  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: "ID de usuario no válido" });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Importe inválido" });
  }

  if (puntos === undefined || puntos === null || isNaN(Number(puntos)) || Number(puntos) < 0 || (!isCarnetAnimal && Number(puntos) === 0)) {
    return res.status(400).json({ success: false, message: "Puntos inválidos" });
  }

  try {
    const puntosAGanar = Math.round(Number(puntos));

    // Obtener puntos actuales ANTES de actualizar
    const userResult = await executeQuery({
      query: "SELECT puntos FROM personas WHERE codigo = ?",
      values: [id],
    }) as Array<{ puntos: number }>;
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    const puntosActuales = userResult[0].puntos || 0;
    const nuevosPuntos = puntosActuales + puntosAGanar;

    // Actualizar puntos
    await executeQuery({
      query: "UPDATE personas SET puntos = ? WHERE codigo = ?",
      values: [nuevosPuntos, id],
    });

    // *** IMPORTANTE: Verificar recompensas desbloqueadas DESPUÉS de actualizar puntos ***
    if (puntosAGanar > 0) {
      await checkAndCreateRewardNotifications(Number(id), puntosActuales, nuevosPuntos);
    }

    // Registrar en logs_points
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (puntosAGanar > 0) {
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
          puntosAGanar,
          fechaCaducidad,
        ],
      });
    }

    // Si es carnet animal, sellar los carnets automáticamente
    if (isCarnetAnimal && Array.isArray(sacos) && sacos.length > 0) {
      for (const saco of sacos as SacoBarrasAPI[]) {
        // Verificar que el carnet existe y no está completado
        const petCardCheck = await executeQuery({
          query: "SELECT * FROM pet_cards WHERE id = ? AND completed = 0",
          values: [saco.petCardId],
        }) as any[];
        
        if (petCardCheck && petCardCheck.length > 0) {
          const petCard = petCardCheck[0];
          const currentStamps = petCard.stamps || 0;
          
          // Obtener configuración de sellos requeridos
          const configResult = await executeQuery({
            query: "SELECT valor FROM config_default_puntos WHERE clave = 'sellos_requeridos_carnet'",
            values: [],
          }) as any[];
          const sellosRequeridos = configResult && configResult.length > 0 
            ? parseInt(configResult[0].valor, 10) 
            : 6;
          
          // Solo sellar si no está completo
          if (currentStamps < sellosRequeridos) {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Obtener configuración de caducidad por inactividad
            const expirationConfig = await getExpirationConfig();
            const expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + expirationConfig.caducidad_carnet_inactividad_meses);
            const expirationDateFormatted = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
            
            // Preparar las fechas de sellos
            let stampDates: string[] = [];
            try {
              if (petCard.stamp_dates) {
                if (typeof petCard.stamp_dates === 'string') {
                  stampDates = JSON.parse(petCard.stamp_dates);
                } else if (Array.isArray(petCard.stamp_dates)) {
                  stampDates = petCard.stamp_dates;
                }
              }
            } catch (e) {
              console.error('Error parseando stamp_dates:', e);
              stampDates = [];
            }
            
            // Añadir la nueva fecha de sello
            stampDates.push(now);
            const newStamps = currentStamps + 1;
            
            // Verificar si se completó el carnet
            const isCompleted = newStamps >= sellosRequeridos;
            
            // Actualizar el carnet con el nuevo sello
            await executeQuery({
              query: `
                UPDATE pet_cards 
                SET stamps = ?, 
                    stamp_dates = ?,
                    expirationDate = ?,
                    completed = ?,
                    updatedAt = ?
                WHERE id = ?
              `,
              values: [
                newStamps,
                JSON.stringify(stampDates),
                isCompleted ? null : expirationDateFormatted,
                isCompleted ? 1 : 0,
                now,
                saco.petCardId
              ],
            });
            
            console.log(`Sello añadido al carnet ${saco.petCardId} (${petCard.petName}). Sellos: ${currentStamps} -> ${newStamps}`);
            
            // Si el carnet se completó, crear la recompensa automáticamente
            if (isCompleted) {
              console.log(`Carnet ${saco.petCardId} completado. Generando recompensa automáticamente...`);
              
              // Calcular fecha de expiración para la recompensa (si la plantilla tiene expiración configurada)
              let fechaExpiracion = null;
              try {
                const rewardTemplateResult = await executeQuery({
                  query: `SELECT expiracion_activa, duracion_meses FROM recompensas WHERE tipo_recompensa = 'carnet' LIMIT 1`
                }) as any[];
                
                if (rewardTemplateResult && rewardTemplateResult.length > 0 && rewardTemplateResult[0].expiracion_activa === 1) {
                  const duracionMeses = rewardTemplateResult[0].duracion_meses || 1;
                  const expDate = new Date();
                  expDate.setMonth(expDate.getMonth() + duracionMeses);
                  fechaExpiracion = expDate.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (templateError) {
                console.error('Error al obtener plantilla de recompensa:', templateError);
              }
              
              // Buscar el precio del producto en la tabla productos_carnet_mascota usando el código de barras
              let productPvp = saco.pvp || 0;
              let productArticulo = null;
              
              if (saco.codigoBarras) {
                try {
                  const productResult = await executeQuery({
                    query: `SELECT Articulo, PVP FROM productos_carnet_mascota WHERE C_Barras = ? LIMIT 1`,
                    values: [saco.codigoBarras]
                  }) as any[];
                  
                  if (productResult && productResult.length > 0) {
                    productPvp = parseFloat(productResult[0].PVP) || productPvp;
                    productArticulo = productResult[0].Articulo;
                  }
                } catch (productError) {
                  console.error('Error al obtener precio del producto:', productError);
                }
              }
              
              // Crear la recompensa en recompensas_carnet_mascota
              if (petCard.userId) {
                try {
                  await executeQuery({
                    query: `
                      INSERT INTO recompensas_carnet_mascota 
                      (user_id, pet_card_id, product_articulo, product_nombre, product_barcode, product_pvp, pet_name, pet_type, fecha_expiracion)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                      petCard.userId,
                      saco.petCardId,
                      productArticulo,
                      petCard.productName,
                      saco.codigoBarras || null,
                      productPvp,
                      petCard.petName,
                      petCard.petType,
                      fechaExpiracion
                    ]
                  });
                  console.log(`Recompensa generada para usuario ${petCard.userId} - Producto: ${petCard.productName} - Precio: ${productPvp}€`);
                } catch (insertError) {
                  console.error('Error al crear recompensa:', insertError);
                }
              }
            }
          } else {
            console.log(`El carnet ${saco.petCardId} ya está completo. No se añade sello.`);
          }
        }
      }
    }

    const tipoCompra = isCarnetAnimal ? "Compra con Carnet mascota" : "Compra";
    let motivo = `${tipoCompra}: Saldo añadido por cajero/admin: ${amount}€`;
    
    if (isCarnetAnimal && Array.isArray(sacos) && sacos.length > 0) {
      const totalSacos = sacos.reduce((total: number, saco: SacoBarrasAPI) => total + (saco.pvp || 0), 0);
      const sacosInfo = sacos.map((saco: SacoBarrasAPI) => `${saco.pvp}€ (${saco.petName})`).join(", ");
      motivo += ` (${sacos.length} sacos [${sacosInfo}], total: ${totalSacos.toFixed(2)}€)`;
    }

    await executeQuery({
      query: `
        INSERT INTO logs_points 
        (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: [
        isCarnetAnimal ? "Compra con Carnet mascota" : "Compra",
        req.user.userId,
        id,
        puntosAGanar,
        puntosActuales,
        nuevosPuntos,
        motivo,
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Saldo añadido correctamente",
      puntosAñadidos: puntosAGanar,
      puntosTotales: nuevosPuntos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al añadir saldo",
      error: (error as Error).message,
    });
  }
}

export default withAuth(addBalanceHandler);