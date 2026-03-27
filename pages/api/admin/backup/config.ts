import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // GET: Obtener configuración de backup
  if (req.method === "GET") {
    try {
      const configRows = await executeQuery({
        query: "SELECT config_key, config_value, description FROM backup_config",
        values: [],
      });

      const config: Record<string, any> = {};
      
      if (Array.isArray(configRows)) {
        for (const row of configRows) {
          try {
            config[row.config_key] = JSON.parse(row.config_value);
          } catch {
            config[row.config_key] = row.config_value;
          }
        }
      }

      return res.status(200).json({
        success: true,
        config,
      });
    } catch (error) {
      console.error("Error al obtener configuración de backup:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener la configuración",
        error: (error as Error).message,
      });
    }
  }

  // PATCH: Actualizar configuración de backup
  if (req.method === "PATCH") {
    try {
      const updates = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        const valueString = typeof value === 'string' ? value : JSON.stringify(value);
        
        const existing = await executeQuery({
          query: "SELECT id FROM backup_config WHERE config_key = ?",
          values: [key],
        });
        
        if (Array.isArray(existing) && existing.length > 0) {
          await executeQuery({
            query: "UPDATE backup_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?",
            values: [valueString, key],
          });
        } else {
          await executeQuery({
            query: "INSERT INTO backup_config (config_key, config_value) VALUES (?, ?)",
            values: [key, valueString],
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Configuración actualizada correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar configuración de backup:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la configuración",
        error: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
