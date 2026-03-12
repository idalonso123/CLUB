import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { StatData, StatsResponse } from "@/types/stats";

async function statsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    
    if (userRole !== "administrador" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }

    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Método no permitido",
      });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0];

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split("T")[0];

    const stats: StatData[] = [];

    // Total de usuarios activos
    const userStats = await Promise.all([
      executeQuery({
        query: "SELECT COUNT(*) as total FROM personas WHERE status = 1",
        values: [],
      }),
      executeQuery({
        query:
          "SELECT COUNT(*) as total FROM personas WHERE creado_en >= ? AND creado_en <= ?",
        values: [oneMonthAgoStr, today],
      }),
      executeQuery({
        query:
          "SELECT COUNT(*) as total FROM personas WHERE creado_en >= ? AND creado_en <= ?",
        values: [twoMonthsAgoStr, oneMonthAgoStr],
      }),
    ]);

    const totalUsers = (userStats[0] as any[])[0].total;
    const newUsersCurrentMonth = (userStats[1] as any[])[0].total;
    const newUsersPreviousMonth = (userStats[2] as any[])[0].total;

    const userChange =
      newUsersPreviousMonth === 0
        ? 100
        : ((newUsersCurrentMonth - newUsersPreviousMonth) /
            newUsersPreviousMonth) *
          100;
    
    stats.push({
      label: "Usuarios Totales",
      value: totalUsers,
      change: 0,
      changeType: "neutral",
      icon: "user-group",
    });

    stats.push({
      label: "Nuevos Registros",
      value: newUsersCurrentMonth,
      change: Math.round(userChange * 100) / 100,
      changeType:
        userChange > 0 ? "increase" : userChange < 0 ? "decrease" : "neutral",
      icon: "user-plus",
    });

    // Consultas para puntos
    const pointsStats = await Promise.all([
      executeQuery({
        query: "SELECT COALESCE(SUM(puntos), 0) as total FROM personas",
        values: [],
      }),

      executeQuery({
        query: `
          SELECT COALESCE(SUM(puntos), 0) as total 
          FROM logs_points 
          WHERE puntos > 0
        `,
        values: [],
      }),

      executeQuery({
        query: `
          SELECT SUM(puntos) as total 
          FROM logs_points 
          WHERE fecha >= ? AND fecha <= ? AND puntos > 0
        `,
        values: [twoMonthsAgoStr, oneMonthAgoStr],
      }),
    ]);

    const totalPoints = (pointsStats[0] as any[])[0].total || 0;
    const newPointsCurrentMonth = (pointsStats[1] as any[])[0].total || 0;
    const newPointsPreviousMonth = (pointsStats[2] as any[])[0].total || 0;

    const pointsChange =
      newPointsPreviousMonth === 0
        ? 100
        : ((newPointsCurrentMonth - newPointsPreviousMonth) /
            newPointsPreviousMonth) *
          100;

    stats.push({
      label: "Puntos Otorgados",
      value: newPointsCurrentMonth,
      change: Math.round(pointsChange * 100) / 100,
      changeType:
        pointsChange > 0
          ? "increase"
          : pointsChange < 0
          ? "decrease"
          : "neutral",
      icon: "coins",
    });

    const activityStats = await Promise.all([
      executeQuery({
        query:
          "SELECT COUNT(*) as total FROM logs_admin",
        values: [],
      }),

      executeQuery({
        query:
          "SELECT COUNT(*) as total FROM logs_admin WHERE created_at >= ? AND created_at <= ?",
        values: [twoMonthsAgoStr, oneMonthAgoStr],
      }),
    ]);

    const activityCurrentMonth = (activityStats[0] as any[])[0].total || 0;
    const activityPreviousMonth = (activityStats[1] as any[])[0].total || 0;

    const activityChange =
      activityPreviousMonth === 0
        ? 100
        : ((activityCurrentMonth - activityPreviousMonth) /
            activityPreviousMonth) *
          100;

    stats.push({
      label: "Acciones Administrativas",
      value: activityCurrentMonth,
      change: Math.round(activityChange * 100) / 100,
      changeType:
        activityChange > 0
          ? "increase"
          : activityChange < 0
          ? "decrease"
          : "neutral",
      icon: "chart-line",
    });

    return res.status(200).json({
      success: true,
      stats,
      timeRange: {
        startDate: oneMonthAgoStr,
        endDate: today,
      },
      previousTimeRange: {
        startDate: twoMonthsAgoStr,
        endDate: oneMonthAgoStr,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos o procesar estadísticas",
      error: (error as Error).message,
    });
  }
}

export default withAuth(statsHandler);
