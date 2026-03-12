import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/types/teller";
import { Reward } from "@/types/rewards";

interface OfferRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onRedeemReward: (rewardId: number) => Promise<void>;
  redeemResult: {
    success: boolean;
    message: string;
  } | null;
}

const OfferRewardsModal: React.FC<OfferRewardsModalProps> = ({
  isOpen,
  onClose,
  user,
  onRedeemReward,
  redeemResult
}) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRewardSelected, setIsRewardSelected] = useState(false);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { 
        type: "tween",
        ease: "easeInOut",
        duration: 0.3 
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  // Cargar recompensas disponibles para el usuario
  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableRewards();
    }
  }, [isOpen, user]);

  const fetchAvailableRewards = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Obtener recompensas disponibles que el usuario puede canjear con sus puntos
      const configResponse = await fetch('/api/config');
      if (!configResponse.ok) {
        throw new Error("Error al cargar configuración");
      }
      const configData = await configResponse.json();
      const tellerRewardsConfig = configData.tellerRewards || { showAllRewards: true, rewardIds: [] };
      
      const response = await fetch(`/api/rewards?minPoints=0&maxPoints=${user.points || 0}`);
      if (!response.ok) {
        throw new Error("Error al cargar recompensas");
      }
      const data = await response.json();
      
      if (data.success) {
        let availableRewards = data.rewards
          .filter((reward: Reward) => reward.available && (reward.stock > 0 || reward.stock === -1));
        
        if (!tellerRewardsConfig.showAllRewards && tellerRewardsConfig.rewardIds.length > 0) {
          availableRewards = availableRewards.filter((reward: Reward) => 
            tellerRewardsConfig.rewardIds.includes(reward.id)
          );
        }
        
        availableRewards = availableRewards.sort((a: Reward, b: Reward) => a.points - b.points);
        
        setRewards(availableRewards);
      } else {
        setError(data.message || "No se pudieron cargar las recompensas");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cargar recompensas");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = async (reward: Reward) => {
    setSelectedReward(reward);
    setIsRewardSelected(true);
  };

  const handleConfirmRedeem = async () => {
    if (selectedReward) {
      await onRedeemReward(selectedReward.id);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && user && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          key="offer-rewards-modal"
        >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        ></motion.div>
        
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative z-10"
          variants={modalVariants}
        >
          <div className="bg-gradient-to-r from-green-700 to-green-800 -m-6 mb-4 p-6 rounded-t-lg text-white">
            <div className="flex justify-start items-center">
              <h3 className="text-xl font-semibold flex items-center">
                <i className="fas fa-gift mr-2"></i>
                {redeemResult?.success ? '¡Recompensa canjeada!' : '¡Puntos suficientes para recompensa!'}
              </h3>
            </div>
            <div className="mt-2">
              <p className="text-white/90 text-sm">
                Usuario: <span className="font-medium">{user.firstName} {user.lastName}</span>
              </p>
              <div className="text-white/80 text-sm flex items-center mt-1">
                <i className="fas fa-star mr-1 text-yellow-300"></i>
                <span>Puntos disponibles: {user.points || 0}</span>
              </div>
              <p className="text-white/90 text-sm mt-2">
                {redeemResult?.success 
                  ? `El cliente ha canjeado la recompensa "${selectedReward?.name}" por ${selectedReward?.points} puntos.`
                  : 'El cliente tiene suficientes puntos para canjear una recompensa. Seleccione una recompensa para canjear o guarde los puntos para después.'
                }
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-3 text-green-700 border-b border-gray-200 pb-2">
              {redeemResult?.success ? 'Recompensa canjeada' : 'Recompensas disponibles'}
            </h4>
            
            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                <p className="mt-2 text-gray-600">Cargando recompensas...</p>
              </div>
            ) : error ? (
              <div className="py-4 text-center text-red-600">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            ) : rewards.length === 0 ? (
              <div className="py-4 text-center text-gray-600">
                <i className="fas fa-info-circle mr-2"></i>
                No hay recompensas disponibles para canjear con {user.points || 0} puntos.
              </div>
            ) : redeemResult?.success ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800">{selectedReward?.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{selectedReward?.description}</p>
                  <div className="flex items-center mt-2 text-yellow-600">
                    <i className="fas fa-star mr-1"></i>
                    <span className="font-medium">{selectedReward?.points} puntos</span>
                  </div>
                </div>
                <div className="ml-4 bg-green-100 text-green-700 border border-green-300 px-3 py-1.5 rounded text-sm font-medium flex items-center">
                  <i className="fas fa-check mr-1"></i>
                  Canjeado
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-800">{reward.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                        <div className="flex items-center mt-2 text-yellow-600">
                          <i className="fas fa-star mr-1"></i>
                          <span className="font-medium">{reward.points} puntos</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={redeemResult?.success}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${
                          selectedReward?.id === reward.id
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-green-700 text-white hover:bg-green-800'
                        }`}
                      >
                        {selectedReward?.id === reward.id ? (
                          <>
                            <i className="fas fa-check mr-1"></i>
                            Seleccionado
                          </>
                        ) : (
                          <>Seleccionar</>  
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {redeemResult && (
              <div className={`mt-4 p-3 rounded ${redeemResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"} text-sm`}>
                <p className="font-medium">{redeemResult.message}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            {redeemResult?.success ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 font-medium"
              >
                <i className="fas fa-check-circle mr-2"></i>
                Completado - Cerrar
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-gray-600 font-medium">¿Qué desea hacer?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 text-sm border border-green-600 text-green-700 rounded-md hover:bg-green-50 font-medium flex items-center justify-center"
                  >
                    <i className="fas fa-piggy-bank mr-1"></i>
                    Guardar puntos
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleConfirmRedeem}
                    disabled={!isRewardSelected || redeemResult?.success}
                    className={`px-3 py-2 text-sm ${
                      isRewardSelected && !redeemResult?.success
                        ? 'bg-green-700 text-white hover:bg-green-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } rounded-md font-medium flex items-center justify-center`}
                  >
                    <i className="fas fa-gift mr-1"></i>
                    Canjear recompensa
                  </button>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-2">
                  <p>{isRewardSelected ? 'Pulse Canjear recompensa para confirmar' : 'Seleccione una recompensa antes de canjear'}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfferRewardsModal;
