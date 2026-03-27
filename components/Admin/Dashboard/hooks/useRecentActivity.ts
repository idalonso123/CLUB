import { useState, useEffect } from 'react';

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  entityName?: string;
}

interface UseRecentActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const useRecentActivity = (limit: number = 5): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch logs de todas las fuentes en paralelo
        const [adminRes, authRes, pointsRes, rewardsRes] = await Promise.all([
          fetch(`/api/admin/logs`),
          fetch(`/api/admin/logs/auth`),
          fetch(`/api/admin/logs/points`),
          fetch(`/api/admin/logs/rewards`)
        ]);

        const [adminData, authData, pointsData, rewardsData] = await Promise.all([
          adminRes.json(),
          authRes.json(),
          pointsRes.json(),
          rewardsRes.json()
        ]);

        if (!adminData.success || !authData.success || !pointsData.success || !rewardsData.success) {
          throw new Error('Error al cargar actividades recientes');
        }

        // Normalizar y mapear logs de cada fuente al formato ActivityItem
        const adminActivities: ActivityItem[] = adminData.logs.map((log: any) => ({
          id: log.id,
          type: log.action,
          description: log.details || '',
          timestamp: log.created_at,
          icon: undefined,
          iconBg: undefined,
          iconColor: undefined,
          entityName: log.entity_name || ''
        }));

        const authActivities: ActivityItem[] = authData.logs.map((log: any) => ({
          id: log.id + 1000000, // Para evitar colisiones de id
          type: log.action,
          description: log.details || '',
          timestamp: log.created_at,
          icon: undefined,
          iconBg: undefined,
          iconColor: undefined,
          entityName: log.user_name || ''
        }));

        const pointsActivities: ActivityItem[] = pointsData.logs.map((log: any) => ({
          id: log.id + 2000000,
          type: log.tipo || 'points_adjustment',
          description: log.motivo || '',
          timestamp: log.fecha,
          icon: undefined,
          iconBg: undefined,
          iconColor: undefined,
          entityName: log.persona_name || ''
        }));

        const rewardsActivities: ActivityItem[] = rewardsData.logs.map((log: any) => ({
          id: log.id + 3000000,
          type: log.action || 'reward_redeem',
          description: log.details || '',
          timestamp: log.created_at,
          icon: undefined,
          iconBg: undefined,
          iconColor: undefined,
          entityName: log.user_name || ''
        }));

        // Unir todos los logs y ordenarlos por fecha descendente
        const allActivities = [
          ...adminActivities,
          ...authActivities,
          ...pointsActivities,
          ...rewardsActivities
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         .slice(0, limit);

        setActivities(allActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError((err as Error).message || 'Error desconocido al cargar actividad reciente');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [refreshKey, limit]);

  const refresh = () => setRefreshKey(prev => prev + 1);

  return {
    activities,
    loading,
    error,
    refresh
  };
};

export default useRecentActivity;