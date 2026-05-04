import { NextApiRequest, NextApiResponse } from "next";
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
        query: `
          SELECT 
            id,
            config_key, 
            config_value, 
            description,
            created_at,
            updated_at
          FROM backup_config
          ORDER BY id ASC
        `,
        values: [],
      });

      const config: Record<string, any> = {};
      const configList: any[] = [];
      
      if (Array.isArray(configRows)) {
        for (const row of configRows as any[]) {
          // Agregar a la configuración por clave
          try {
            config[row.config_key] = JSON.parse(row.config_value);
          } catch {
            config[row.config_key] = row.config_value;
          }
          
          // Agregar a la lista completa
          configList.push({
            id: row.id,
            key: row.config_key,
            value: row.config_value,
            description: row.description || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          });
        }
      }

      return res.status(200).json({
        success: true,
        config,
        configList,
      });
    } catch (error: any) {
      console.error("Error al obtener configuración de backup:", error);
      
      // Manejar error de tabla no existente
      if (error.message?.includes('not exist') || error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: "La tabla de configuración de backup no existe. Ejecuta el script SQL de creación de tablas.",
          error: "Tabla no encontrada",
          code: "TABLE_NOT_EXISTS",
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error al obtener la configuración",
        error: error.message || "Error desconocido",
      });
    }
  }

  // PUT: Actualizar configuración completa de backup
  if (req.method === "PUT") {
    try {
      const { key, value, description } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: "Se requiere la clave de configuración",
        });
      }

      const valueString = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Verificar si existe
      const existing = await executeQuery({
        query: "SELECT id FROM backup_config WHERE config_key = ?",
        values: [key],
      }) as any[];
      
      if (Array.isArray(existing) && existing.length > 0) {
        // Actualizar existente
        await executeQuery({
          query: `
            UPDATE backup_config 
            SET config_value = ?, description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP 
            WHERE config_key = ?
          `,
          values: [valueString, description || null, key],
        });
        
        return res.status(200).json({
          success: true,
          message: "Configuración actualizada correctamente",
        });
      } else {
        // Insertar nuevo
        await executeQuery({
          query: `
            INSERT INTO backup_config (config_key, config_value, description) 
            VALUES (?, ?, ?)
          `,
          values: [key, valueString, description || null],
        });
        
        return res.status(201).json({
          success: true,
          message: "Configuración creada correctamente",
        });
      }
    } catch (error: any) {
      console.error("Error al actualizar configuración de backup:", error);
      
      if (error.message?.includes('not exist') || error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: "La tabla de configuración de backup no existe. Ejecuta el script SQL de creación de tablas.",
          error: "Tabla no encontrada",
          code: "TABLE_NOT_EXISTS",
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la configuración",
        error: error.message || "Error desconocido",
      });
    }
  }

  // PATCH: Actualizar múltiples configuraciones de backup
  if (req.method === "PATCH") {
    try {
      const updates = req.body;
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Se requieren datos de configuración válidos",
        });
      }
      
      const results: any[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        try {
          const valueString = typeof value === 'string' ? value : JSON.stringify(value);
          
          // Verificar si existe
          const existing = await executeQuery({
            query: "SELECT id FROM backup_config WHERE config_key = ?",
            values: [key],
          }) as any[];
          
          if (Array.isArray(existing) && existing.length > 0) {
            await executeQuery({
              query: `
                UPDATE backup_config 
                SET config_value = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE config_key = ?
              `,
              values: [valueString, key],
            });
          } else {
            await executeQuery({
              query: `
                INSERT INTO backup_config (config_key, config_value) 
                VALUES (?, ?)
              `,
              values: [key, valueString],
            });
          }
          
          results.push({ key, status: 'success' });
        } catch (itemError: any) {
          console.error(`Error al actualizar ${key}:`, itemError);
          results.push({ key, status: 'error', error: itemError.message });
        }
      }

      const hasErrors = results.some(r => r.status === 'error');
      
      return res.status(hasErrors ? 207 : 200).json({
        success: !hasErrors,
        message: hasErrors ? " Algunas configuraciones no se pudieron actualizar" : "Configuración actualizada correctamente",
        results,
      });
    } catch (error: any) {
      console.error("Error al actualizar configuración de backup:", error);
      
      if (error.message?.includes('not exist') || error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: "La tabla de configuración de backup no existe. Ejecuta el script SQL de creación de tablas.",
          error: "Tabla no encontrada",
          code: "TABLE_NOT_EXISTS",
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la configuración",
        error: error.message || "Error desconocido",
      });
    }
  }

  // DELETE: Eliminar configuración específica
  if (req.method === "DELETE") {
    try {
      const { key } = req.query;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: "Se requiere la clave de configuración a eliminar",
        });
      }

      const result = await executeQuery({
        query: "DELETE FROM backup_config WHERE config_key = ?",
        values: [key],
      });

      return res.status(200).json({
        success: true,
        message: "Configuración eliminada correctamente",
      });
    } catch (error: any) {
      console.error("Error al eliminar configuración de backup:", error);
      
      if (error.message?.includes('not exist') || error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: "La tabla de configuración de backup no existe. Ejecuta el script SQL de creación de tablas.",
          error: "Tabla no encontrada",
          code: "TABLE_NOT_EXISTS",
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error al eliminar la configuración",
        error: error.message || "Error desconocido",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);
