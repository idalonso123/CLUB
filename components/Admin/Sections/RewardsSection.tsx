import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useRewards from '@/components/Admin/Rewards/hooks/useRewards';
import RewardCard from '@/components/Admin/Rewards/RewardCard';
import RewardFormModal from '@/components/Admin/Rewards/RewardFormModal';
import DeleteConfirmationModal from '@/components/Admin/Rewards/DeleteConfirmationModal';
import NotificationSystem from '@/components/Admin/Common/NotificationSystem';
import { Reward } from '@/types/rewards';
import { registerRewardsRefreshCallback, unregisterRewardsRefreshCallback } from '@/components/Admin/RewardsProvider';

interface ModalType {
  type: 'add' | 'edit';
  reward?: Reward;
}

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const RewardsContext = React.createContext<{
  openAddModal: () => void;
}>({
  openAddModal: () => {}
});

const RewardsSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para el modal (añadir/editar)
  const [modal, setModal] = useState<ModalType | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  
  // Estado para notificaciones
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Usar el hook personalizado para gestionar las recompensas
  const { 
    rewards, 
    loading: isLoading, 
    error, 
    fetchRewards, 
    addReward, 
    updateReward, 
    deleteReward 
  } = useRewards();

  // Registrar callback para actualizar cuando se añade recompensa desde otro lugar
  useEffect(() => {
    registerRewardsRefreshCallback(fetchRewards);
    return () => {
      unregisterRewardsRefreshCallback();
    };
  }, [fetchRewards]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Función para crear una nueva recompensa
  const handleAddReward = async (formData: Reward) => {
    try {
      const result = await addReward(formData);
      if (result.success) {
        showNotification('success', 'Recompensa creada correctamente');
        setModal(null);
      } else {
        throw new Error(result.message || 'Error al crear la recompensa');
      }
    } catch (err: any) {
      console.error('Error al crear recompensa:', err);
      showNotification('error', err.message || 'Error al crear la recompensa');
    }
  };

  // Función para actualizar una recompensa existente
  const handleUpdateReward = async (formData: Reward) => {
    if (!formData.id) return;
    
    try {
      const result = await updateReward(formData.id, formData);
      if (result.success) {
        showNotification('success', 'Recompensa actualizada correctamente');
        setModal(null);
      } else {
        throw new Error(result.message || 'Error al actualizar la recompensa');
      }
    } catch (err: any) {
      console.error('Error al actualizar recompensa:', err);
      showNotification('error', err.message || 'Error al actualizar la recompensa');
    }
  };

  // Función para eliminar una recompensa
  const handleDeleteReward = async (id: number, forceDelete: boolean = false) => {
    try {
      const result = await deleteReward(id, forceDelete);
      
      if (result.success) {
        if (result.disabled) {
          showNotification('info', 'La recompensa ha sido desactivada ya que tiene canjes asociados');
        } else if (forceDelete) {
          showNotification('success', 'Recompensa y sus canjes asociados eliminados correctamente');
        } else {
          showNotification('success', 'Recompensa eliminada correctamente');
        }
      } else {
        throw new Error(result.message || 'Error al eliminar la recompensa');
      }
    } catch (err: any) {
      console.error('Error al eliminar recompensa:', err);
      showNotification('error', err.message || 'Error al eliminar la recompensa');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Abrir modal para añadir
  const openAddModal = () => setModal({ type: 'add' });

  // Abrir modal para editar
  const openEditModal = (reward: Reward) => setModal({ type: 'edit', reward });

  // Filtrar recompensas por término de búsqueda
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    reward.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizado condicional para estados de carga y error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-red-700 mb-2">{error}</p>
        <button 
          onClick={fetchRewards}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <RewardsContext.Provider value={{ openAddModal }}>
      <div className="space-y-6">
        {/* Sistema de notificaciones */}
        <NotificationSystem notifications={notifications} onClose={(id) => 
          setNotifications(prev => prev.filter(n => n.id !== id))
        } />

        <motion.h1 
          className="text-2xl font-bold text-green-800"
          variants={itemVariants}
        >
          Gestión de Recompensas
        </motion.h1>
        
        {/* Barra de búsqueda y botón de añadir */}
        <motion.div 
          className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
          variants={itemVariants}
        >
          <div className="relative w-full sm:w-auto sm:flex-grow sm:mr-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar recompensa..."
              className="pl-10 w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center justify-center"
          >
            <i className="fas fa-plus-circle mr-2"></i>
            Añadir recompensa
          </button>
        </motion.div>
        
        {/* Tarjetas de recompensas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          {filteredRewards.map(reward => {
            const normalizedReward = {
              ...reward,
              description: reward.description ?? "",
              imageUrl: reward.imageUrl ?? ""
            };
            return (
              <RewardCard 
                key={reward.id} 
                reward={normalizedReward}
                onEdit={() => openEditModal(normalizedReward)} 
                onDelete={() => setDeleteConfirmation(reward.id)} 
              />
            );
          })}
          
          {/* Mensaje si no hay resultados */}
          {filteredRewards.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              <i className="fas fa-search text-3xl mb-2"></i>
              <p>No se encontraron recompensas que coincidan con tu búsqueda.</p>
            </div>
          )}
        </motion.div>

        {/* Modal para añadir/editar recompensa */}
        {modal && (
          <RewardFormModal
            isOpen={true}
            onClose={() => setModal(null)}
            type={modal.type}
            reward={modal.reward}
            onSubmit={modal.type === 'add' ? handleAddReward : handleUpdateReward}
          />
        )}

        {/* Modal de confirmación para eliminar */}
        {deleteConfirmation !== null && (
          <DeleteConfirmationModal
            isOpen={true}
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={(forceDelete) => handleDeleteReward(deleteConfirmation, forceDelete)}
            rewardId={deleteConfirmation}
          />
        )}
      </div>
    </RewardsContext.Provider>
  );
};

export default RewardsSection;