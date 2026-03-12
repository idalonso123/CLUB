import { useState, useEffect } from 'react';

interface ChartDataItem {
  date: string;
  value: number;
}

export function useUserGrowthData(period: 'week' | 'month' | 'year' = 'month') {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/stats/users?period=${period}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        if (data.success && data.charts) {
          const newUsersChart = data.charts.find((chart: any) => chart.label === "Nuevos registros");
          if (newUsersChart) {
            setChartData(newUsersChart.data);
          } else {
            setError("No se encontraron datos de nuevos registros");
          }
        } else {
          setError(data.message || "Error al obtener datos");
        }
      } catch (err) {
        setError(`Error al cargar datos: ${(err as Error).message}`);
        console.error("Error al obtener estadísticas de usuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { chartData, loading, error };
}
