import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { ChartData, StatsChartResponse } from "@/types/stats";

async function userStatsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar que el usuario sea administrador
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

    // Obtener periodo seleccionado (por defecto último mes)
    const period = (req.query.period as string) || 'month';
    
    // Obtener fecha actual
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Definir inicio del periodo según selección
    let startDate: string;
    let groupFormat: string;
    
    switch (period) {
      case 'week':
        // Último 7 días
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 6);  // 6 days back + today = 7 days
        startDate = lastWeek.toISOString().split('T')[0];
        groupFormat = '%Y-%m-%d'; // Agrupar por día
        break;
      case 'month':
        // Último mes
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        startDate = lastMonth.toISOString().split('T')[0];
        groupFormat = '%Y-%m-%d'; // Agrupar por día
        break;
      case 'year':
        // Último año
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        startDate = lastYear.toISOString().split('T')[0];
        groupFormat = '%Y-%m'; // Agrupar por mes
        break;
      default:
        // Por defecto último mes
        const defaultMonth = new Date();
        defaultMonth.setMonth(now.getMonth() - 1);
        startDate = defaultMonth.toISOString().split('T')[0];
        groupFormat = '%Y-%m-%d'; // Agrupar por día
    }
    
    // Consultar nuevos registros por fecha
    const newUsersQuery = `
      SELECT 
        DATE_FORMAT(p.creado_en, '${groupFormat}') as date,
        COUNT(*) as value
      FROM 
        personas p
      WHERE 
        p.creado_en >= ? 
        AND p.creado_en <= ?
      GROUP BY 
        DATE_FORMAT(p.creado_en, '${groupFormat}')
      ORDER BY 
        date ASC
    `;
    
    const usersResult = await executeQuery({
      query: newUsersQuery,
      values: [startDate, today]
    });
    
    // Consultar distribución de usuarios por rol
    const roleDistributionQuery = `
      SELECT 
        p.rol as label,
        COUNT(*) as value
      FROM 
        personas p
      WHERE 
        p.status = 1
      GROUP BY 
        p.rol
      ORDER BY 
        value DESC
    `;
    
    const rolesResult = await executeQuery({
      query: roleDistributionQuery,
      values: []
    });
    
    // NUEVO: Consultar usuarios activos vs inactivos
    const activeStatusQuery = `
      SELECT 
        CASE WHEN p.status = 1 THEN 'Activo' ELSE 'Inactivo' END as label,
        COUNT(*) as value
      FROM 
        personas p
      GROUP BY 
        p.status
      ORDER BY 
        p.status DESC
    `;
    
    const activeStatusResult = await executeQuery({
      query: activeStatusQuery,
      values: []
    });
    
    // NUEVO: Distribución de puntos por rangos
    const pointsDistributionQuery = `
      SELECT 
        CASE 
          WHEN puntos = 0 THEN '0 puntos'
          WHEN puntos BETWEEN 1 AND 100 THEN '1-100 puntos'
          WHEN puntos BETWEEN 101 AND 500 THEN '101-500 puntos'
          WHEN puntos BETWEEN 501 AND 1000 THEN '501-1000 puntos'
          WHEN puntos BETWEEN 1001 AND 5000 THEN '1001-5000 puntos'
          ELSE 'Más de 5000 puntos'
        END as label,
        COUNT(*) as value
      FROM 
        personas
      WHERE
        status = 1
      GROUP BY 
        label
      ORDER BY 
        CASE 
          WHEN label = '0 puntos' THEN 1
          WHEN label = '1-100 puntos' THEN 2
          WHEN label = '101-500 puntos' THEN 3
          WHEN label = '501-1000 puntos' THEN 4
          WHEN label = '1001-5000 puntos' THEN 5
          ELSE 6
        END
    `;
    
    const pointsDistributionResult = await executeQuery({
      query: pointsDistributionQuery,
      values: []
    });
    
    // NUEVO: Distribución geográfica (por provincia)
    const locationDistributionQuery = `
      SELECT 
        IFNULL(d.provincia, 'No especificado') as label,
        COUNT(*) as value
      FROM 
        personas p
      LEFT JOIN 
        direcciones d ON p.codigo = d.codigo
      WHERE
        p.status = 1
      GROUP BY 
        d.provincia
      ORDER BY 
        value DESC
      LIMIT 10
    `;
    
    const locationDistributionResult = await executeQuery({
      query: locationDistributionQuery,
      values: []
    });
    
    // Crear objeto de respuesta con los datos para gráficos
    const charts: ChartData[] = [
      {
        label: "Nuevos registros",
        data: (usersResult as any[]).map(item => ({
          date: item.date,
          value: item.value
        })),
        color: "#10B981" // Verde para nuevos registros
      },
      {
        label: "Distribución por rol",
        data: (rolesResult as any[]).map(item => ({
          date: item.label, // Rol como "fecha"
          value: item.value
        })),
        color: "#6366F1" // Índigo para distribución por rol
      },
      {
        label: "Estado de cuentas",
        data: (activeStatusResult as any[]).map(item => ({
          date: item.label,
          value: item.value
        })),
        color: "#F59E0B" // Ámbar para estado de activación
      },
      {
        label: "Distribución de puntos",
        data: (pointsDistributionResult as any[]).map(item => ({
          date: item.label,
          value: item.value
        })),
        color: "#EC4899" // Rosa para distribución de puntos
      },
      {
        label: "Distribución geográfica",
        data: (locationDistributionResult as any[]).map(item => ({
          date: item.label,
          value: item.value
        })),
        color: "#3B82F6" // Azul para distribución geográfica
      }
    ];
    
    return res.status(200).json({
      success: true,
      charts,
      timeRange: {
        startDate,
        endDate: today
      }
    });
    
  } catch (error) {
    console.error("Error al obtener estadísticas de usuarios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de usuarios",
      error: (error as Error).message,
    });
  }
}

export default withAuth(userStatsHandler);

