import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function pointsLogsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar permisos de administrador
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo GET
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    // Paginación y filtros
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const personaId = req.query.personaId as string;
    const actorId = req.query.actorId as string;
    const tipo = req.query.tipo as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    let query = `
      SELECT 
        lp.id,
        lp.tipo,
        lp.actor_id,
        CONCAT(a.nombres, ' ', a.apellidos) as actor_name,
        lp.persona_id,
        CONCAT(p.nombres, ' ', p.apellidos) as persona_name,
        lp.puntos,
        lp.puntos_previos,
        lp.puntos_nuevos,
        lp.motivo,
        lp.fecha
      FROM logs_points lp
      LEFT JOIN personas a ON lp.actor_id = a.codigo
      LEFT JOIN personas p ON lp.persona_id = p.codigo
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (personaId) {
      query += " AND lp.persona_id = ?";
      queryParams.push(personaId);
    }
    if (actorId) {
      query += " AND lp.actor_id = ?";
      queryParams.push(actorId);
    }
    if (tipo) {
      query += " AND lp.tipo = ?";
      queryParams.push(tipo);
    }
    if (fromDate) {
      query += " AND lp.fecha >= ?";
      queryParams.push(fromDate);
    }
    if (toDate) {
      query += " AND lp.fecha <= ?";
      queryParams.push(toDate + " 23:59:59");
    }

    // Orden y paginación
    query += " ORDER BY lp.fecha DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    const logs = await executeQuery({
      query,
      values: queryParams,
    });

    // Total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM logs_points lp WHERE 1=1`;
    const countParams: any[] = [];
    if (personaId) {
      countQuery += " AND lp.persona_id = ?";
      countParams.push(personaId);
    }
    if (actorId) {
      countQuery += " AND lp.actor_id = ?";
      countParams.push(actorId);
    }
    if (tipo) {
      countQuery += " AND lp.tipo = ?";
      countParams.push(tipo);
    }
    if (fromDate) {
      countQuery += " AND lp.fecha >= ?";
      countParams.push(fromDate);
    }
    if (toDate) {
      countQuery += " AND lp.fecha <= ?";
      countParams.push(toDate + " 23:59:59");
    }
    const totalResult = await executeQuery({
      query: countQuery,
      values: countParams,
    });
    const total = (totalResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error al obtener logs de puntos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de puntos",
      error: (error as Error).message,
    });
  }
}

export default withAuth(pointsLogsHandler);
