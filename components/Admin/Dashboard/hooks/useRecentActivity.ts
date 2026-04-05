/**
 * Hook refactorizado para actividad reciente del dashboard
 * 
 * Mejoras:
 * - Uso de React Query para caché y revalidación
 * - Tipado completo sin uso de 'any'
 * - Manejo de errores parciales
 * - Fetch en paralelo optimizado
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

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

interface LogEntry {
  id: number;
  action: string;
  details?: string;
  created_at: string;
  entity_name?: string;
  user_name?: string;
  tipo?: string;
  motivo?: string;
  fecha?: string;
  persona_name?: string;
}

interface LogsResponse {
  success: boolean;
  logs: LogEntry[];
  message?: string;
}

interface UseRecentActivityOptions {
  limit?: number;
  enabled?: boolean;
}

interface UseRecentActivityReturn {
  activities: ActivityItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Función para obtener actividad reciente
 * Maneja fallos parciales de las diferentes fuentes
 */
async function fetchRecentActivity(limit: number): Promise<ActivityItem[]> {
  // Fuentes de logs a consultar
  const endpoints = [
    { url: '/api/admin/logs', offset: 0, source: 'admin' },
    { url: '/api/admin/logs/auth', offset: 1000000, source: 'auth' },
    { url: '/api/admin/logs/points', offset: 2000000, source: 'points' },
    { url: '/api/admin/logs/rewards', offset: 3000000, source: 'rewards' }
  ];

  // Ejecutar todas las peticiones en paralelo
  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const response = await fetch(endpoint.url);
      
      if (!response.ok) {
        throw new Error(`Error fetching ${endpoint.source} logs: ${response.status}`);
      }
      
      const data: LogsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(`API error for ${endpoint.source} logs`);
      }
      
      return {
        source: endpoint.source,
        offset: endpoint.offset,
        logs: data.logs || []
      };
    })
  );

  // Recopilar actividades válidas, ignorando fallos parciales
  const allActivities: ActivityItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { source, offset, logs } = result.value;
      
      const mappedActivities = logs.map((log: LogEntry): ActivityItem => {
        switch (source) {
          case 'admin':
            return {
              id: log.id + offset,
              type: log.action,
              description: log.details || '',
              timestamp: log.created_at,
              entityName: log.entity_name || ''
            };
          case 'auth':
            return {
              id: log.id + offset,
              type: log.action,
              description: log.details || '',
              timestamp: log.created_at,
              entityName: log.user_name || ''
            };
          case 'points':
            return {
              id: log.id + offset,
              type: log.tipo || 'points_adjustment',
              description: log.motivo || '',
              timestamp: log.fecha || log.created_at,
              entityName: log.persona_name || ''
            };
          case 'rewards':
            return {
              id: log.id + offset,
              type: log.action || 'reward_redeem',
              description: log.details || '',
              timestamp: log.created_at,
              entityName: log.user_name || ''
            };
          default:
            return {
              id: log.id + offset,
              type: 'unknown',
              description: log.details || '',
              timestamp: log.created_at,
              entityName: ''
            };
        }
      });
      
      allActivities.push(...mappedActivities);
    } else {
      // Log del fallo para debugging, pero no lanzar error
      console.warn(`Failed to fetch ${source} logs:`, result.reason);
    }
  }

  // Ordenar por fecha descendente y limitar
  return allActivities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Hook para obtener actividad reciente del dashboard
 */
export function useRecentActivity(options: UseRecentActivityOptions = {}): UseRecentActivityReturn {
  const { limit = 5, enabled = true } = options;
  const queryClient = useQueryClient();

  const {
    data: activities = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['admin-recent-activity', limit],
    queryFn: () => fetchRecentActivity(limit),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutos (más corto porque es actividad reciente)
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-recent-activity'] });
  };

  return {
    activities,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook para invalidar caché de actividad reciente
 */
export function useInvalidateRecentActivity() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-recent-activity'] });
  };
}
