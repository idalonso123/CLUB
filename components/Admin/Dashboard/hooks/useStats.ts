import { useState, useEffect } from 'react';
import { StatData, TimeRange, StatsResponse } from '@/types/stats';

interface UseStatsReturn {
  stats: StatData[];
  timeRange: TimeRange | undefined;
  previousTimeRange: TimeRange | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const useStats = (): UseStatsReturn => {
  const [stats, setStats] = useState<StatData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | undefined>(undefined);
  const [previousTimeRange, setPreviousTimeRange] = useState<TimeRange | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/stats');
        const data: StatsResponse = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Error al cargar estadísticas');
        }
        
        setStats(data.stats || []);
        setTimeRange(data.timeRange);
        setPreviousTimeRange(data.previousTimeRange);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError((err as Error).message || 'Error desconocido al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [refreshKey]);
  
  const refresh = () => setRefreshKey(prev => prev + 1);

  return {
    stats,
    timeRange,
    previousTimeRange,
    loading,
    error,
    refresh
  };
};

export default useStats;