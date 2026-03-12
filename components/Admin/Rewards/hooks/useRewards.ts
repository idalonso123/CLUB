import { useState, useEffect } from 'react';

interface Reward {
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

interface ApiResponse {
  success: boolean;
  message?: string;
  reward?: Reward;
  disabled?: boolean;
}

const useRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las recompensas
  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/rewards');
      const data = await response.json();
      
      if (data.success) {
        setRewards(data.rewards || []);
      } else {
        throw new Error(data.message || 'Error al cargar recompensas');
      }
    } catch (err: any) {
      console.error('Error al cargar recompensas:', err);
      setError(err.message || 'No se pudieron cargar las recompensas');
    } finally {
      setLoading(false);
    }
  };

  // Añadir una nueva recompensa
  const addReward = async (rewardData: Reward): Promise<ApiResponse> => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rewardData),
      });
      
      const data = await response.json();
      
      if (data.success && data.reward) {
        setRewards(prev => [data.reward, ...prev]);
      }
      
      return data;
    } catch (err: any) {
      console.error('Error al añadir recompensa:', err);
      return { 
        success: false, 
        message: err.message || 'Error al añadir recompensa' 
      };
    }
  };

  // Actualizar una recompensa existente
  const updateReward = async (id: number, rewardData: Reward): Promise<ApiResponse> => {
    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rewardData),
      });
      
      const data = await response.json();
      
      if (data.success && data.reward) {
        setRewards(prev => 
          prev.map(reward => reward.id === id ? data.reward : reward)
        );
      }
      
      return data;
    } catch (err: any) {
      console.error('Error al actualizar recompensa:', err);
      return { 
        success: false, 
        message: err.message || 'Error al actualizar recompensa' 
      };
    }
  };

  // Eliminar una recompensa
  const deleteReward = async (id: number, forceDelete: boolean = false): Promise<ApiResponse> => {
    try {
      const response = await fetch(`/api/admin/rewards/${id}?forceDelete=${forceDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.disabled) {
          // Si la recompensa fue desactivada en lugar de eliminada
          setRewards(prev => 
            prev.map(reward => {
              // Obtener la recompensa actual para verificar si tiene stock ilimitado
              const currentReward = prev.find(r => r.id === id);
              // Si la recompensa tiene stock -1 (ilimitado), preservar ese valor
              const newStock = currentReward && currentReward.stock === -1 ? -1 : 0;
              return reward.id === id ? { ...reward, available: false, stock: newStock } : reward;
            })
          );
        } else {
          // Si la recompensa fue eliminada completamente
          setRewards(prev => prev.filter(reward => reward.id !== id));
        }
      }
      
      return data;
    } catch (err: any) {
      console.error('Error al eliminar recompensa:', err);
      return { 
        success: false, 
        message: err.message || 'Error al eliminar recompensa' 
      };
    }
  };

  // Cargar recompensas al inicializar el hook
  useEffect(() => {
    fetchRewards();
  }, []);

  return {
    rewards,
    loading,
    error,
    fetchRewards,
    addReward,
    updateReward,
    deleteReward
  };
};

export default useRewards;
