import React from 'react';
import { motion } from 'framer-motion';
import { Reward } from '@/types/rewards';

interface RewardCardProps {
  reward: Reward;
  onEdit: () => void;
  onDelete: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, onEdit, onDelete }) => {
  return (
    <motion.div
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="relative mb-3">
        {/* Indicador de disponibilidad */}
        <div className={`absolute top-0 right-0 m-2 px-2 py-1 text-xs font-bold rounded ${reward.available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {reward.available ? 'Disponible' : 'No disponible'}
        </div>
        
        {/* Indicador de canjeo múltiple */}
        {reward.canjeoMultiple && (
          <div className="absolute top-0 left-0 m-2 px-2 py-1 text-xs font-bold rounded bg-purple-600 text-white">
            <i className="fas fa-sync-alt mr-1"></i>
            Canjeo Múltiple
          </div>
        )}
        
        {/* Imagen de la recompensa */}
        <div className="h-40 bg-gray-200 rounded-md overflow-hidden">
          {reward.imageUrl ? (
            <img 
              src={reward.imageUrl} 
              alt={reward.name} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <i className="fas fa-image text-3xl"></i>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold text-gray-800 mb-1">{reward.name}</h2>
          <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
            <i className="fas fa-coins text-yellow-600 mr-1"></i>
            <span className="text-sm font-bold">{reward.points}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{reward.description || 'Sin descripción'}</p>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-500">
            <i className="fas fa-tag mr-1"></i>
            <span>{reward.category}</span>
          </div>
          <div className={`flex items-center ${reward.stock === -1 ? 'text-green-600' : reward.stock > 10 ? 'text-green-600' : reward.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            <i className="fas fa-box mr-1"></i>
            <span>Stock: {reward.stock === -1 ? 'Ilimitado' : reward.stock}</span>
          </div>
        </div>
        
        {/* Información de expiración */}
        {reward.expiracionActiva && (
          <div className="flex items-center text-sm text-blue-600 mt-2">
            <i className="fas fa-clock mr-1"></i>
            <span>Al canjear expira en: {reward.duracionMeses} {reward.duracionMeses === 1 ? 'mes' : 'meses'}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
        <button 
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700"
        >
          <i className="fas fa-edit mr-1"></i> Editar
        </button>
        <button 
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <i className="fas fa-trash-alt mr-1"></i> Eliminar
        </button>
      </div>
    </motion.div>
  );
};

export default RewardCard;
