import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function authLogsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir GET
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    // Parámetros de paginación y filtrado
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    
    // Filtros opcionales
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const ipAddress = req.query.ipAddress as string;
    
    // Construir la consulta base
    let query = `
      SELECT 
        al.id,
        al.user_id,
        CONCAT(p.nombres, ' ', p.apellidos) as user_name,
        p.mail as user_email,
        al.action,
        al.ip_address,
        al.user_agent,
        al.details,
        al.created_at
      FROM 
        logs_auth al
      JOIN 
        personas p ON al.user_id = p.codigo
      WHERE 1=1
    `;
    
    // Array para los valores de parámetros
    const queryParams: any[] = [];
    
    // Añadir filtros si se proporcionan
    if (action) {
      query += " AND al.action = ?";
      queryParams.push(action);
    }
    
    if (userId) {
      query += " AND al.user_id = ?";
      queryParams.push(userId);
    }
    
    if (ipAddress) {
      query += " AND al.ip_address LIKE ?";
      queryParams.push(`%${ipAddress}%`);
    }
    
    if (fromDate) {
      query += " AND al.created_at >= ?";
      queryParams.push(fromDate);
    }
    
    if (toDate) {
      query += " AND al.created_at <= ?";
      queryParams.push(toDate + ' 23:59:59');
    }
    
    // Añadir ordenación
    query += " ORDER BY al.created_at DESC";
    
    // Consulta para contar registros totales (para paginación)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM logs_auth al
      WHERE 1=1
      ${action ? " AND al.action = ?" : ""}
      ${userId ? " AND al.user_id = ?" : ""}
      ${ipAddress ? " AND al.ip_address LIKE ?" : ""}
      ${fromDate ? " AND al.created_at >= ?" : ""}
      ${toDate ? " AND al.created_at <= ?" : ""}
    `;
    
    // Ejecutar consulta de conteo
    const countResult = await executeQuery({
      query: countQuery,
      values: [...queryParams]
    });
    
    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Añadir límites para paginación
    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);
    
    // Ejecutar consulta principal
    const logs = await executeQuery({
      query,
      values: queryParams
    });
    
    // Parsear los detalles JSON si existen (manejar texto plano y JSON válido)
    const formattedLogs = (logs as any[]).map(log => {
      let parsedDetails = {};
      
      if (log.details) {
        try {
          // Intentar parsear como JSON
          parsedDetails = JSON.parse(log.details);
        } catch (e) {
          // Si no es JSON válido, guardar como texto plano
          parsedDetails = { message: log.details };
        }
      }
      
      return {
        ...log,
        details: parsedDetails
      };
    });
    
    return res.status(200).json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
    
  } catch (error) {
    console.error("Error al obtener logs de autenticación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de autenticación",
      error: (error as Error).message,
    });
  }
}

export default withAuth(authLogsHandler);
