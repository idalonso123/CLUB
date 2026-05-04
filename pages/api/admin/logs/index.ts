import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function logsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir método GET
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    // Parámetros de paginación y filtrado
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Máximo 50 por página
    const offset = (page - 1) * limit;

    // Filtros avanzados
    const action = req.query.action as string;
    const adminId = req.query.adminId as string;
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId as string;

    // Asegurar que fromDate y toDate sean strings simples (no arrays)
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    if (Array.isArray(fromDate)) fromDate = fromDate[0];
    if (Array.isArray(toDate)) toDate = toDate[0];
    fromDate = fromDate as string;
    toDate = toDate as string;

    // Construir la consulta base - modificada para evitar la referencia a la tabla 'recompensas'
    let query = `
      SELECT 
        la.id,
        la.admin_id,
        CONCAT(p.nombres, ' ', p.apellidos) as admin_name,
        la.action,
        la.entity_type,
        la.entity_id,
        la.details,
        la.created_at,
        CASE
          WHEN la.entity_type = 'user' THEN (SELECT CONCAT(nombres, ' ', apellidos) FROM personas WHERE codigo = la.entity_id)
          ELSE NULL
        END as entity_name
      FROM 
        logs_admin la
      LEFT JOIN
        personas p ON la.admin_id = p.codigo
      WHERE 1=1
    `;
    
    // Arrays para los valores de parámetros y condiciones WHERE
    const queryParams: any[] = [];
    const whereConditions: string[] = [];
    
    // Añadir filtros avanzados
    if (action) {
      whereConditions.push("la.action = ?");
      queryParams.push(action);
    }
    
    if (adminId) {
      whereConditions.push("la.admin_id = ?");
      queryParams.push(adminId);
    }
    
    if (entityType) {
      whereConditions.push("la.entity_type = ?");
      queryParams.push(entityType);
    }
    
    if (entityId) {
      whereConditions.push("la.entity_id = ?");
      queryParams.push(entityId);
    }
    
    if (fromDate) {
      whereConditions.push("la.created_at >= ?");
      queryParams.push(`${fromDate} 00:00:00`);
    }
    
    if (toDate) {
      whereConditions.push("la.created_at <= ?");
      queryParams.push(`${toDate} 23:59:59`);
    }
    
    // Añadir condiciones WHERE a la consulta
    if (whereConditions.length > 0) {
      query += " AND " + whereConditions.join(" AND ");
    }
    
    // Añadir ordenación y límites
    query += " ORDER BY la.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);
    
    // Ejecutar la consulta
    const logs = await executeQuery({
      query,
      values: queryParams,
    });
    
    // Consulta para el total de registros (para paginación)
    let countQuery = `
      SELECT COUNT(*) as total FROM logs_admin la WHERE 1=1
    `;
    
    if (whereConditions.length > 0) {
      countQuery += " AND " + whereConditions.join(" AND ");
    }
    
    const totalResult = await executeQuery({
      query: countQuery,
      values: queryParams.slice(0, queryParams.length - 2), // Eliminar limit y offset
    });
    
    const total = (totalResult as any[])[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Formatear los datos de los logs
    const formattedLogs = (logs as any[]).map((log) => {
      // Intentar parsear el campo 'details' si es un JSON
      let details = log.details;
      try {
        if (typeof details === "string" && details.startsWith("{")) {
          details = JSON.parse(details);
        }
      } catch (e) {
        // Si falla el parseo, dejarlo como está
      }
      
      return {
        ...log,
        details,
      };
    });
    
    return res.status(200).json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error al obtener logs:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de actividad",
      error: (error as Error).message,
    });
  }
}

export default withAuth(logsHandler);
