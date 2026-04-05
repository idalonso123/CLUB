/**
 * Hook refactorizado para gestión de recompensas
 * 
 * Utiliza React Query para:
 * - Caché automático de recompensas
 * - Invalidación automática tras mutaciones
 * - Estados de loading/error consistentes
 * - Retry automático en caso de fallo
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ============================================================================
// TIPOS
// ============================================================================

export interface Reward {
  id: number;
  name: string;
  description: string | null;
  points: number;
  imageUrl: string | null;
  available: boolean;
  category: string;
  stock: number;
  canjeoMultiple?: boolean;
  expiracionActiva?: boolean;
  duracionMeses?: number;
  barcodes?: {
    id?: number;
    codigo: string;
    descripcion?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

interface RewardsResponse {
  success: boolean;
  rewards: Reward[];
  message?: string;
}

interface RewardResponse {
  success: boolean;
  reward?: Reward;
  message?: string;
  disabled?: boolean;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  disabled?: boolean;
}

interface UseRewardsOptions {
  enabled?: boolean;
}

// ============================================================================
// CLAVES DE CACHÉ
// ============================================================================

export const REWARDS_QUERY_KEY = ['admin-rewards'];

// ============================================================================
// MUTATIONS
// ============================================================================

interface AddRewardInput {
  name: string;
  description?: string;
  points: number;
  imageUrl?: string;
  available?: boolean;
  category: string;
  stock?: number;
  canjeoMultiple?: boolean;
  expiracionActiva?: boolean;
  duracionMeses?: number;
}

interface UpdateRewardInput {
  id: number;
  data: Partial<Reward>;
}

// ============================================================================
// HOOK PRINCIPAL: OBTENER RECOMPENSAS
// ============================================================================

/**
 * Hook para obtener lista de recompensas
 */
export function useRewards(options: UseRewardsOptions = {}) {
  const { enabled = true } = options;

  return useQuery<RewardsResponse>({
    queryKey: REWARDS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('/api/admin/rewards');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al cargar recompensas');
      }
      
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });
}

// ============================================================================
// HOOK: AÑADIR RECOMPENSA
// ============================================================================

/**
 * Hook para añadir una nueva recompensa
 */
export function useAddReward() {
  const queryClient = useQueryClient();

  return useMutation<RewardResponse, Error, AddRewardInput>({
    mutationFn: async (rewardData) => {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rewardData),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al añadir recompensa');
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidar caché para refrescar la lista
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
      toast.success('Recompensa añadida correctamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: ACTUALIZAR RECOMPENSA
// ============================================================================

/**
 * Hook para actualizar una recompensa existente
 */
export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation<RewardResponse, Error, UpdateRewardInput>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al actualizar recompensa');
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
      toast.success('Recompensa actualizada correctamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: ELIMINAR RECOMPENSA
// ============================================================================

/**
 * Hook para eliminar una recompensa
 */
export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, { id: number; forceDelete?: boolean }>({
    mutationFn: async ({ id, forceDelete = false }) => {
      const response = await fetch(`/api/admin/rewards/${id}?forceDelete=${forceDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar recompensa');
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
      
      if (data.disabled) {
        toast.success('Recompensa desactivada correctamente');
      } else {
        toast.success('Recompensa eliminada correctamente');
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: CAMBIAR DISPONIBILIDAD
// ============================================================================

/**
 * Hook para activar/desactivar una recompensa
 */
export function useToggleRewardAvailability() {
  const queryClient = useQueryClient();

  return useMutation<RewardResponse, Error, number>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al cambiar disponibilidad');
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
      toast.success(`Recompensa ${data.reward?.available ? 'activada' : 'desactivada'} correctamente`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: INVALIDAR CACHÉ
// ============================================================================

/**
 * Hook para invalidar manualmente el caché de recompensas
 */
export function useInvalidateRewards() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
  };
}

// ============================================================================
// HOOK LEGACY (para compatibilidad)
// ============================================================================

/**
 * Hook legacy que mantiene la misma API que el original
 * pero usa React Query internamente
 * 
 * @deprecated Usar los hooks individuales (useRewards, useAddReward, etc.) 
 * para mejor control y tipado
 */
export function useRewardsLegacy(autoFetch: boolean = true) {
  const queryClient = useQueryClient();
  
  const { 
    data, 
    isLoading: loading, 
    error,
    refetch 
  } = useRewards({ enabled: autoFetch });

  const addRewardMutation = useAddReward();
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();

  const fetchRewards = () => {
    refetch();
  };

  const addReward = async (rewardData: Omit<Reward, 'id'>) => {
    return addRewardMutation.mutateAsync(rewardData as AddRewardInput);
  };

  const updateReward = async (id: number, rewardData: Partial<Reward>) => {
    return updateRewardMutation.mutateAsync({ id, data: rewardData });
  };

  const deleteReward = async (id: number, forceDelete: boolean = false) => {
    return deleteRewardMutation.mutateAsync({ id, forceDelete });
  };

  return {
    rewards: data?.rewards || [],
    loading,
    error: error as Error | null,
    fetchRewards,
    addReward,
    updateReward,
    deleteReward,
  };
}
