import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { addMonths, addYears } from "date-fns";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo admin
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // PATCH: Actualizar la configuración
  if (req.method === "PATCH") {
    try {
      const { eurosPorPunto, puntosBienvenida, tellerRewards, expiration } = req.body;
      let updated = false;

      // Procesar configuraciones de caducidad PRIMERO (antes de los returns)
      if (expiration !== undefined) {
        try {
          // Validar estructura de expiration
          if (typeof expiration !== 'object' || expiration === null) {
            return res.status(400).json({
              success: false,
              message: "El formato de la configuración de caducidad es inválido",
            });
          }

          const { caducidad_puntos_meses, caducidad_carnet_inactividad_meses, caducidad_carnet_antiguedad_meses } = expiration;

          // Validar valores
          if (
            typeof caducidad_puntos_meses !== 'number' || !Number.isInteger(caducidad_puntos_meses) || caducidad_puntos_meses < 1 ||
            typeof caducidad_carnet_inactividad_meses !== 'number' || !Number.isInteger(caducidad_carnet_inactividad_meses) || caducidad_carnet_inactividad_meses < 1 ||
            typeof caducidad_carnet_antiguedad_meses !== 'number' || !Number.isInteger(caducidad_carnet_antiguedad_meses) || caducidad_carnet_antiguedad_meses < 1
          ) {
            return res.status(400).json({
              success: false,
              message: "Los valores de caducidad deben ser números enteros positivos",
            });
          }

          // Guardar configuración de caducidad de puntos
          const checkPuntosResult = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_default_puntos WHERE clave = 'caducidad_puntos_meses'",
            values: [],
          });
          const puntosConfigExists = Array.isArray(checkPuntosResult) && checkPuntosResult.length > 0 && checkPuntosResult[0].count > 0;
          
          if (puntosConfigExists) {
            await executeQuery({
              query: "UPDATE config_default_puntos SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE clave = 'caducidad_puntos_meses'",
              values: [caducidad_puntos_meses],
            });
          } else {
            await executeQuery({
              query: "INSERT INTO config_default_puntos (clave, valor) VALUES ('caducidad_puntos_meses', ?)",
              values: [caducidad_puntos_meses],
            });
          }

          // Actualizar TODOS los puntos existentes no caducados
          const puntosActivosResult = await executeQuery({
            query: "SELECT id, fecha_ingreso FROM puntos_caducidad WHERE caducado = 0",
            values: [],
          }) as Array<{ id: number; fecha_ingreso: Date }>;

          for (const punto of puntosActivosResult) {
            const nuevaFechaCaducidad = addMonths(new Date(punto.fecha_ingreso), caducidad_puntos_meses);
            await executeQuery({
              query: "UPDATE puntos_caducidad SET fecha_caducidad = ? WHERE id = ?",
              values: [nuevaFechaCaducidad, punto.id],
            });
          }

          // Guardar configuración de caducidad de carnet por inactividad
          const checkInactividadResult = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_default_puntos WHERE clave = 'caducidad_carnet_inactividad_meses'",
            values: [],
          });
          const inactividadConfigExists = Array.isArray(checkInactividadResult) && checkInactividadResult.length > 0 && checkInactividadResult[0].count > 0;
          
          if (inactividadConfigExists) {
            await executeQuery({
              query: "UPDATE config_default_puntos SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE clave = 'caducidad_carnet_inactividad_meses'",
              values: [caducidad_carnet_inactividad_meses],
            });
          } else {
            await executeQuery({
              query: "INSERT INTO config_default_puntos (clave, valor) VALUES ('caducidad_carnet_inactividad_meses', ?)",
              values: [caducidad_carnet_inactividad_meses],
            });
          }

          // Actualizar TODOS los carnets de mascota no completados ni expirados
          const petCardsResult = await executeQuery({
            query: "SELECT id, stamp_dates FROM pet_cards WHERE completed = 0 AND isExpired = 0",
            values: [],
          }) as Array<{ id: number; stamp_dates: string | null }>;

          for (const card of petCardsResult) {
            let lastStampDate: Date;
            if (card.stamp_dates) {
              try {
                const stampDates = JSON.parse(card.stamp_dates);
                if (Array.isArray(stampDates) && stampDates.length > 0) {
                  lastStampDate = new Date(stampDates[stampDates.length - 1]);
                } else {
                  lastStampDate = new Date();
                }
              } catch {
                lastStampDate = new Date();
              }
            } else {
              lastStampDate = new Date();
            }
            const nuevaExpirationDate = addMonths(lastStampDate, caducidad_carnet_inactividad_meses);
            await executeQuery({
              query: "UPDATE pet_cards SET expirationDate = ? WHERE id = ?",
              values: [nuevaExpirationDate.toISOString().slice(0, 19).replace('T', ' '), card.id],
            });
          }

          // Guardar configuración de caducidad de carnet por antigüedad
          const checkAntiguedadResult = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_default_puntos WHERE clave = 'caducidad_carnet_antiguedad_meses'",
            values: [],
          });
          const antiguedadConfigExists = Array.isArray(checkAntiguedadResult) && checkAntiguedadResult.length > 0 && checkAntiguedadResult[0].count > 0;
          
          if (antiguedadConfigExists) {
            await executeQuery({
              query: "UPDATE config_default_puntos SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE clave = 'caducidad_carnet_antiguedad_meses'",
              values: [caducidad_carnet_antiguedad_meses],
            });
          } else {
            await executeQuery({
              query: "INSERT INTO config_default_puntos (clave, valor) VALUES ('caducidad_carnet_antiguedad_meses', ?)",
              values: [caducidad_carnet_antiguedad_meses],
            });
          }

          updated = true;

          // Si solo se enviaron configuraciones de caducidad, retornar directamente
          if (eurosPorPunto === undefined && puntosBienvenida === undefined && tellerRewards === undefined) {
            return res.status(200).json({
              success: true,
              message: "Configuración de caducidad actualizada correctamente. Se han actualizado todos los registros existentes.",
              details: {
                puntosActualizados: puntosActivosResult.length,
                carnetsActualizados: petCardsResult.length
              }
            });
          }
        } catch (error) {
          console.error("Error al actualizar la configuración de caducidad:", error);
          return res.status(500).json({
            success: false,
            message: "Error al actualizar la configuración de caducidad",
            error: (error as Error).message,
          });
        }
      }

      // Validar y guardar el valor por defecto
      if (eurosPorPunto !== undefined) {
        if (typeof eurosPorPunto !== "number" || eurosPorPunto <= 0) {
          return res.status(400).json({
            success: false,
            message: "El valor debe ser un número positivo",
          });
        }

        try {
          // Primero verificamos si existe el registro con id=1
          const checkResult = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_default_puntos WHERE id = 1",
            values: [],
          });
          
          const recordExists = Array.isArray(checkResult) && checkResult.length > 0 && checkResult[0].count > 0;
          
          if (recordExists) {
            // Si existe, actualizamos
            await executeQuery({
              query: "UPDATE config_default_puntos SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = 1",
              values: [eurosPorPunto],
            });
          } else {
            // Si no existe, lo creamos
            await executeQuery({
              query: "INSERT INTO config_default_puntos (id, valor) VALUES (1, ?)",
              values: [eurosPorPunto],
            });
          }

          updated = true;

          // No retornar aquí, continuar para procesar otras configuraciones
        } catch (error) {
          console.error("Error al actualizar la configuración:", error);
          return res.status(500).json({
            success: false,
            message: "Error al actualizar la configuración",
            error: (error as Error).message,
          });
        }
      }

      if (tellerRewards !== undefined) {
        try {
          if (typeof tellerRewards !== 'object' || tellerRewards === null) {
            return res.status(400).json({
              success: false,
              message: "El formato de la configuración de recompensas es inválido",
            });
          }

          const checkTellerConfig = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_rewards_teller WHERE clave = 'teller_rewards'",
            values: [],
          });
          
          const tellerConfigExists = Array.isArray(checkTellerConfig) && 
                                   checkTellerConfig.length > 0 && 
                                   checkTellerConfig[0].count > 0;
          
          const tellerRewardsJson = JSON.stringify(tellerRewards);
          
          if (tellerConfigExists) {
            await executeQuery({
              query: "UPDATE config_rewards_teller SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE clave = 'teller_rewards'",
              values: [tellerRewardsJson],
            });
          } else {
            await executeQuery({
              query: "INSERT INTO config_rewards_teller (clave, valor) VALUES ('teller_rewards', ?)",
              values: [tellerRewardsJson],
            });
          }

          updated = true;
        } catch (error) {
          console.error("Error al actualizar la configuración de recompensas:", error);
          return res.status(500).json({
            success: false,
            message: "Error al actualizar la configuración de recompensas",
            error: (error as Error).message,
          });
        }
      }

      if (puntosBienvenida !== undefined) {
        if (typeof puntosBienvenida !== "number" || puntosBienvenida < 0 || !Number.isInteger(puntosBienvenida)) {
          return res.status(400).json({
            success: false,
            message: "Los puntos de bienvenida deben ser un número entero positivo",
          });
        }

        try {
          const checkResult = await executeQuery({
            query: "SELECT COUNT(*) as count FROM config_default_puntos WHERE clave = 'puntos_bienvenida'",
            values: [],
          });
          
          const recordExists = Array.isArray(checkResult) && checkResult.length > 0 && checkResult[0].count > 0;
          
          if (recordExists) {
            await executeQuery({
              query: "UPDATE config_default_puntos SET valor = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE clave = 'puntos_bienvenida'",
              values: [puntosBienvenida],
            });
          } else {
            await executeQuery({
              query: "INSERT INTO config_default_puntos (clave, valor) VALUES ('puntos_bienvenida', ?)",
              values: [puntosBienvenida],
            });
          }

          updated = true;
        } catch (error) {
          console.error("Error al actualizar los puntos de bienvenida:", error);
          return res.status(500).json({
            success: false,
            message: "Error al actualizar los puntos de bienvenida",
            error: (error as Error).message,
          });
        }
      }

      if (updated) {
        return res.status(200).json({
          success: true,
          message: "Configuración actualizada correctamente",
        });
      }

      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos válidos para actualizar",
      });
    } catch (error) {
      console.error("Error al actualizar la configuración:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la configuración",
        error: (error as Error).message,
      });
    }
  }

  // GET: obtener la configuración actual
  if (req.method === "GET") {
    try {
      const configRows = await executeQuery({
        query: "SELECT * FROM config_default_puntos WHERE id = 1 LIMIT 1",
        values: [],
      });
      
      const welcomePointsRows = await executeQuery({
        query: "SELECT * FROM config_default_puntos WHERE clave = 'puntos_bienvenida' LIMIT 1",
        values: [],
      });

      const tellerRewardsQuery = await executeQuery({
        query: "SELECT valor FROM config_rewards_teller WHERE clave = 'teller_rewards'",
        values: [],
      });

      // Obtener configuraciones de caducidad
      const caducidadPuntosRows = await executeQuery({
        query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_puntos_meses' LIMIT 1",
        values: [],
      });

      const caducidadCarnetInactividadRows = await executeQuery({
        query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_carnet_inactividad_meses' LIMIT 1",
        values: [],
      });

      const caducidadCarnetAntiguedadRows = await executeQuery({
        query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_carnet_antiguedad_meses' LIMIT 1",
        values: [],
      });

      // Parsear la configuración de recompensas o usar valores predeterminados
      let tellerRewards = { showAllRewards: true, rewardIds: [] };
      if (Array.isArray(tellerRewardsQuery) && tellerRewardsQuery.length > 0) {
        try {
          tellerRewards = JSON.parse(tellerRewardsQuery[0].valor);
        } catch (e) {
          console.error('Error al parsear la configuración de recompensas:', e);
        }
      }

      // Devolver la configuración
      const eurosPorPunto = Array.isArray(configRows) && configRows.length > 0 
        ? parseFloat(configRows[0].valor) 
        : 3.5;
        
      const puntosBienvenida = Array.isArray(welcomePointsRows) && welcomePointsRows.length > 0 
        ? parseInt(welcomePointsRows[0].valor) 
        : 5;

      const caducidad_puntos_meses = Array.isArray(caducidadPuntosRows) && caducidadPuntosRows.length > 0 
        ? parseInt(caducidadPuntosRows[0].valor) 
        : 12;

      const caducidad_carnet_inactividad_meses = Array.isArray(caducidadCarnetInactividadRows) && caducidadCarnetInactividadRows.length > 0 
        ? parseInt(caducidadCarnetInactividadRows[0].valor) 
        : 6;

      const caducidad_carnet_antiguedad_meses = Array.isArray(caducidadCarnetAntiguedadRows) && caducidadCarnetAntiguedadRows.length > 0 
        ? parseInt(caducidadCarnetAntiguedadRows[0].valor) 
        : 24;

      return res.status(200).json({
        success: true,
        config: {
          eurosPorPunto,
          puntosBienvenida,
          tellerRewards,
          expiration: {
            caducidad_puntos_meses,
            caducidad_carnet_inactividad_meses,
            caducidad_carnet_antiguedad_meses
          }
        }
      });
    } catch (error) {
      console.error("Error al obtener la configuración:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener la configuración",
        error: (error as Error).message,
      });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
