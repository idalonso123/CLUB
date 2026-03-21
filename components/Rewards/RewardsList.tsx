import React from 'react';
import { motion } from 'framer-motion';
import RewardItem from './RewardItem';
import { Reward } from '@/types/rewards';

interface RewardsListProps {
  rewards: Reward[];
  userPoints: number;
  onRedeemClick: (reward: Reward) => void;
  searchTerm: string;
  selectedCategory: string;
}

const RewardsList: React.FC<RewardsListProps> = ({ 
  rewards, 
  userPoints, 
  onRedeemClick,
  searchTerm,
  selectedCategory
}) => {
  // Filtrar recompensas por búsqueda y categoría
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? reward.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Variantes de animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="mb-8"
    >
      {filteredRewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <RewardItem
              key={reward.id}
              reward={reward}
              userPoints={userPoints}
              onRedeemClick={onRedeemClick}
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="bg-white p-8 rounded-lg shadow-sm text-center"
        >
          <div className="text-5xl text-gray-300 mb-4">
            <i className="fas fa-search"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No se encontraron recompensas</h3>
          <p className="text-gray-600">Intenta con otra búsqueda o categoría</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RewardsList;
