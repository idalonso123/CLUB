import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function exportLogsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    const exportType = req.query.exportType as string;
    const format = req.query.format as string;
    const userId = req.query.userId as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    
    // Construir la consulta base
    let query = `
      SELECT 
        el.id,
        el.user_id,
        CONCAT(p.nombres, ' ', p.apellidos) as user_name,
        p.mail as user_email,
        el.export_type,
        el.format,
        el.filters,
        el.record_count,
        el.ip_address,
        el.created_at
      FROM 
        logs_export el
      JOIN 
        personas p ON el.user_id = p.codigo
      WHERE 1=1
    `;
    
    // Array para los valores de parámetros
    const queryParams: any[] = [];
    
    // Añadir filtros si se proporcionan
    if (exportType) {
      query += " AND el.export_type = ?";
      queryParams.push(exportType);
    }
    
    if (format) {
      query += " AND el.format = ?";
      queryParams.push(format);
    }
    
    if (userId) {
      query += " AND el.user_id = ?";
      queryParams.push(userId);
    }
    
    if (fromDate) {
      query += " AND el.created_at >= ?";
      queryParams.push(fromDate);
    }
    
    if (toDate) {
      query += " AND el.created_at <= ?";
      queryParams.push(toDate + ' 23:59:59');
    }
    
    // Añadir ordenación
    query += " ORDER BY el.created_at DESC";
    
    // Consulta para contar registros totales (para paginación)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM logs_export el
      WHERE 1=1
      ${exportType ? " AND el.export_type = ?" : ""}
      ${format ? " AND el.format = ?" : ""}
      ${userId ? " AND el.user_id = ?" : ""}
      ${fromDate ? " AND el.created_at >= ?" : ""}
      ${toDate ? " AND el.created_at <= ?" : ""}
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
    
    // Parsear el JSON de filtros
    const formattedLogs = (logs as any[]).map(log => ({
      ...log,
      filters: log.filters ? JSON.parse(log.filters) : {}
    }));
    
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
    console.error("Error al obtener logs de exportación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de exportación",
      error: (error as Error).message,
    });
  }
}

export default withAuth(exportLogsHandler);
