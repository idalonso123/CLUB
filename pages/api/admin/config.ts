import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo admin
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // PATCH: Actualizar la configuración
  if (req.method === "PATCH") {
    try {
      const { eurosPorPunto, puntosBienvenida, tellerRewards } = req.body;
      let updated = false;

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

          if (tellerRewards === undefined) {
            return res.status(200).json({
              success: true,
              message: "Configuración actualizada correctamente",
            });
          }
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

      return res.status(200).json({
        success: true,
        config: {
          eurosPorPunto,
          puntosBienvenida,
          tellerRewards
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
