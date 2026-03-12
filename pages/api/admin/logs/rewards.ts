import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function rewardsLogsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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

    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const rewardId = req.query.rewardId as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    let query = `
      SELECT 
        lr.id,
        lr.user_id,
        CONCAT(p.nombres, ' ', p.apellidos) as user_name,
        lr.action,
        lr.reward_id,
        r.nombre as reward_name,
        lr.details,
        lr.created_at
      FROM logs_rewards lr
      LEFT JOIN personas p ON lr.user_id = p.codigo
      LEFT JOIN recompensas r ON lr.reward_id = r.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (userId) {
      query += " AND lr.user_id = ?";
      queryParams.push(userId);
    }
    if (action) {
      query += " AND lr.action = ?";
      queryParams.push(action);
    }
    if (rewardId) {
      query += " AND lr.reward_id = ?";
      queryParams.push(rewardId);
    }
    if (fromDate) {
      query += " AND lr.created_at >= ?";
      queryParams.push(fromDate);
    }
    if (toDate) {
      query += " AND lr.created_at <= ?";
      queryParams.push(toDate + " 23:59:59");
    }

    // Añadir orden y paginación
    query += " ORDER BY lr.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Petición a la base de datos
    const logs = await executeQuery({
      query,
      values: queryParams,
    });

    // Total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM logs_rewards lr WHERE 1=1`;
    const countParams: any[] = [];
    if (userId) {
      countQuery += " AND lr.user_id = ?";
      countParams.push(userId);
    }
    if (action) {
      countQuery += " AND lr.action = ?";
      countParams.push(action);
    }
    if (rewardId) {
      countQuery += " AND lr.reward_id = ?";
      countParams.push(rewardId);
    }
    if (fromDate) {
      countQuery += " AND lr.created_at >= ?";
      countParams.push(fromDate);
    }
    if (toDate) {
      countQuery += " AND lr.created_at <= ?";
      countParams.push(toDate + " 23:59:59");
    }
    const totalResult = await executeQuery({
      query: countQuery,
      values: countParams,
    });
    const total = (totalResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Parsear detalles si es JSON
    const formattedLogs = (logs as any[]).map(log => ({
      ...log,
      details: log.details ? (() => {
        try {
          return JSON.parse(log.details);
        } catch {
          return log.details;
        }
      })() : null
    }));

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
    console.error("Error al obtener logs de recompensas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener logs de recompensas",
      error: (error as Error).message,
    });
  }
}

export default withAuth(rewardsLogsHandler);
