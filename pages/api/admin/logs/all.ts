import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function logsAllHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    // Parámetros de paginación y ordenación
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || "created_at";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "ASC" : "DESC";

    // Unir logs de todas las tablas relevantes
    const unionQuery = `
      SELECT id, admin_id as user_id, CONCAT(p.nombres, ' ', p.apellidos) as user_name, action, entity_type, entity_id, details, created_at, 'admin' as log_type
      FROM logs_admin la
      LEFT JOIN personas p ON la.admin_id = p.codigo
      UNION ALL
      SELECT id, user_id, CONCAT(p.nombres, ' ', p.apellidos) as user_name, action, NULL as entity_type, NULL as entity_id, ip_address as details, created_at, 'auth' as log_type
      FROM logs_auth l
      LEFT JOIN personas p ON l.user_id = p.codigo
      UNION ALL
      SELECT id, user_id, CONCAT(p.nombres, ' ', p.apellidos) as user_name, export_type as action, format as entity_type, record_count as entity_id, NULL as details, created_at, 'export' as log_type
      FROM logs_export l
      LEFT JOIN personas p ON l.user_id = p.codigo
      UNION ALL
      SELECT id, actor_id as user_id, CONCAT(pa.nombres, ' ', pa.apellidos) as user_name, tipo as action, persona_id as entity_type, l.puntos as entity_id, NULL as details, fecha as created_at, 'points' as log_type
      FROM logs_points l
      LEFT JOIN personas pa ON l.actor_id = pa.codigo
      UNION ALL
      SELECT id, user_id, CONCAT(p.nombres, ' ', p.apellidos) as user_name, action, reward_id as entity_type, NULL as entity_id, details, created_at, 'rewards' as log_type
      FROM logs_rewards l
      LEFT JOIN personas p ON l.user_id = p.codigo
    `;

    // Consulta principal con paginación y ordenación
    const mainQuery = `
      SELECT * FROM (
        ${unionQuery}
      ) AS all_logs
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Consulta para el total de registros
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        ${unionQuery}
      ) AS all_logs
    `;

    // Obtener logs
    const logs = await executeQuery({
      query: mainQuery,
      values: [limit, offset],
    });

    // Obtener total
    const totalResult = await executeQuery({
      query: countQuery,
      values: [],
    });
    const total = (totalResult as any[])[0].total;
    const totalPages = Math.ceil(total / limit);

    // Formatear los datos de los logs
    const formattedLogs = (logs as any[]).map((log) => {
      let details = log.details;
      try {
        if (typeof details === "string" && details.startsWith("{")) {
          details = JSON.parse(details);
        }
      } catch (e) {}
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
    console.error("Error al obtener logs (all):", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de actividad (all)",
      error: (error as Error).message,
    });
  }
}

export default withAuth(logsAllHandler);
