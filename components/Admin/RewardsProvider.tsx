import React, { useState, ReactNode, useRef, useCallback } from 'react';
import { RewardsContext } from '@/components/Admin/Sections/RewardsSection';
import RewardFormModal from '@/components/Admin/Rewards/RewardFormModal';
import { Reward } from '@/types/rewards';
import useRewards from '@/components/Admin/Rewards/hooks/useRewards';

interface RewardsProviderProps {
  children: ReactNode;
}

interface ModalType {
  type: 'add' | 'edit';
  reward?: Reward;
}

// Callback para notificar a RewardsSection cuando se añade una recompensa
let refreshCallback: (() => void) | null = null;

export const registerRewardsRefreshCallback = (callback: () => void) => {
  refreshCallback = callback;
};

export const unregisterRewardsRefreshCallback = () => {
  refreshCallback = null;
};

const RewardsProvider: React.FC<RewardsProviderProps> = ({ children }) => {
  const [modal, setModal] = useState<ModalType | null>(null);
  const { addReward } = useRewards(false); // No cargar automáticamente
  
  const openAddModal = () => setModal({ type: 'add' });

  const handleAddReward = async (formData: Reward) => {
    try {
      await addReward(formData);
      setModal(null);
      // Notificar a RewardsSection para que recargue los datos
      if (refreshCallback) {
        refreshCallback();
      }
    } catch (error) {
      console.error('Error al crear recompensa:', error);
    }
  };

  return (
    <RewardsContext.Provider value={{ openAddModal }}>
      {children}
      
      {modal && (
        <RewardFormModal
          isOpen={true}
          onClose={() => setModal(null)}
          type={modal.type}
          reward={modal.reward}
          onSubmit={handleAddReward}
        />
      )}
    </RewardsContext.Provider>
  );
};

export default RewardsProvider;
