/**
 * Hook refactorizado para estadísticas del dashboard
 * 
 * Utiliza React Query para caché automático, revalidación
 * y mejor manejo de estados de carga/error.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatData, TimeRange, StatsResponse } from '@/types/stats';
import { showErrorToast } from '@/hooks/useErrorHandler';

interface UseStatsOptions {
  refetchInterval?: number; // Intervalo de revalidación automática (ms)
  enabled?: boolean;
}

interface UseStatsReturn {
  stats: StatData[];
  timeRange: TimeRange | undefined;
  previousTimeRange: TimeRange | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook para obtener estadísticas del dashboard
 * 
 * Características:
 * - Caché automático de datos
 * - Revalidación en segundo plano
 * - Estados de loading/fetching separados
 * - Invalidación manual disponible
 */
export function useStats(options: UseStatsOptions = {}): UseStatsReturn {
  const { refetchInterval, enabled = true } = options;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
  } = useQuery<StatsResponse>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: StatsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al cargar estadísticas');
      }
      
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: refetchInterval, // Automatic refetch if provided
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Función para invalidar y refrescar
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  return {
    stats: data?.stats || [],
    timeRange: data?.timeRange,
    previousTimeRange: data?.previousTimeRange,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// HOOKS AUXILIARES PARA DATOS ESPECÍFICOS
// ============================================================================

/**
 * Hook para obtener solo el conteo de usuarios
 */
export function useUsersCount() {
  return useQuery({
    queryKey: ['admin-stats-users-count'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats/users');
      if (!response.ok) throw new Error('Error al cargar conteo de usuarios');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook para invalidar caché de estadísticas
 */
export function useInvalidateStats() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    invalidateUsersCount: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats-users-count'] });
    },
  };
}
