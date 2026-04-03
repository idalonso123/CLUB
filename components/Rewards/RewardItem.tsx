import React from "react";
import { motion } from "framer-motion";
import { Reward } from "@/types/rewards";

interface RewardItemProps {
  reward: Reward;
  userPoints: number;
  onRedeemClick: (reward: Reward) => void;
}

const RewardItem: React.FC<RewardItemProps> = ({
  reward,
  userPoints,
  onRedeemClick,
}) => {
  // Estado del botón de canje
  const isDisabled =
    !reward.available ||
    (reward.stock <= 0 && reward.stock !== -1) ||
    userPoints < reward.points ||
    (reward.redeemed && !reward.canjeoMultiple);

  // Determinar el mensaje del botón
  const getButtonText = () => {
    if (reward.redeemed && !reward.canjeoMultiple) return "Ya canjeado";
    if (reward.redeemed && reward.canjeoMultiple) return "Canjear de nuevo";
    if (userPoints < reward.points)
      return `Te faltan ${reward.points - userPoints} puntos`;
    if (reward.available && (reward.stock > 0 || reward.stock === -1)) return "Canjear ahora";
    return "No disponible";
  };

  // Determinar si mostrar aviso de stock bajo
  const showLowStockWarning =
    reward.available && reward.stock > 0 && reward.stock <= 5 && reward.stock !== -1;

  // Variantes de animación para la tarjeta
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative mb-3">
        {/* Indicador de disponibilidad */}
        <div
          className={`absolute top-0 right-0 m-2 px-2 py-1 text-xs font-bold rounded ${
            reward.redeemed
              ? "bg-blue-500 text-white"
              : reward.available && reward.stock === -1
              ? "bg-green-800 text-white"
              : reward.available && reward.stock <= 5
              ? "bg-yellow-500 text-white"
              : reward.available
              ? "bg-green-800 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {reward.redeemed
            ? "Canjeado"
            : reward.available && reward.stock === -1
            ? "Disponible Siempre"
            : reward.available && reward.stock <= 5
            ? "Últimas Unidades"
            : reward.available
            ? "Disponible"
            : "No disponible"}
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
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <i className="fas fa-gift text-4xl text-gray-400"></i>
            </div>
          )}
        </div>
      </div>

      {/* Detalles de la recompensa */}
      <div>
        <h3 className="font-bold text-lg mb-1">{reward.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{reward.description}</p>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-yellow-600 font-bold">
            <i className="fas fa-star mr-1"></i>
            <span>{reward.points} puntos</span>
          </div>

          {/* Mostrar aviso de stock bajo en vez del número exacto */}
          {/* {showLowStockWarning && (
            <div className="flex items-center text-yellow-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              <span className="text-sm">¡Quedan pocas unidades!</span>
            </div>
          )} */}
        </div>
        
        {/* Información de expiración */}
        {reward.expiracionActiva && (
          <div className="flex items-center text-sm text-blue-600 mb-3">
            <i className="fas fa-clock mr-1"></i>
            <span>Al canjear expira en: {reward.duracionMeses} {reward.duracionMeses === 1 ? 'mes' : 'meses'}</span>
          </div>
        )}

        {/* Botón de canje */}
        <button
          onClick={() => onRedeemClick(reward)}
          disabled={isDisabled}
          className={`w-full py-2 px-3 rounded-md font-medium flex items-center justify-center
            ${
              !isDisabled
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          <i
            className={`${
              reward.redeemed ? "fas fa-check" : "fas fa-exchange-alt"
            } mr-2`}
          ></i>
          {getButtonText()}
        </button>
      </div>
    </motion.div>
  );
};

export default RewardItem;
