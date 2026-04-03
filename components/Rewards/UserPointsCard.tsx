import React from 'react';
import { motion } from 'framer-motion';

interface UserPointsCardProps {
  userPoints: number;
  premiumThreshold?: number;
}

const UserPointsCard: React.FC<UserPointsCardProps> = ({ 
  userPoints, 
  premiumThreshold = 500 
}) => {
  // Calcular el progreso para el siguiente nivel
  const progressPercentage = Math.min(userPoints / premiumThreshold * 100, 100);
  const isPremium = userPoints >= premiumThreshold;
  
  // Variantes de animación
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm"
    >
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-semibold text-green-700">Tus Puntos</h3>
          <p className="text-gray-600">Canjeables por productos y descuentos</p>
        </div>
        <div className="flex items-center">
          <i className="fas fa-star text-yellow-500 text-2xl mr-2"></i>
          <span className="text-3xl font-bold text-green-800">{userPoints || 0}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${Math.min((userPoints || 0) / 10, 100)}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((userPoints || 0) / 10, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" as const }}
          ></motion.div>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {isPremium 
            ? '¡Nivel Girasol alcanzado!' 
            : `${premiumThreshold - (userPoints || 0)} puntos más para alcanzar nivel Girasol`}
        </div>
      </div>
    </motion.div>
  );
};

export default UserPointsCard;
