import React, { useState, ReactNode } from 'react';
import { RewardsContext } from '@/components/Admin/Sections/RewardsSection';
import RewardFormModal from '@/components/Admin/Rewards/RewardFormModal';
import useRewards from '@/components/Admin/Rewards/hooks/useRewards';
import { Reward } from '@/types/rewards';

interface RewardsProviderProps {
  children: ReactNode;
}

interface ModalType {
  type: 'add' | 'edit';
  reward?: Reward;
}

const RewardsProvider: React.FC<RewardsProviderProps> = ({ children }) => {
  const [modal, setModal] = useState<ModalType | null>(null);
  const { addReward } = useRewards();
  
  const openAddModal = () => setModal({ type: 'add' });
  
  const handleAddReward = async (formData: Reward) => {
    try {
      await addReward(formData);
      setModal(null);
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
