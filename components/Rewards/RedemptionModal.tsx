import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reward } from '@/types/rewards';
import Modal from '@/components/Common/Modal/Modal';
import ActionButtons from '@/components/Common/Modal/ActionButtons';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  userPoints: number;
  onConfirmRedemption: (notes: string) => Promise<void>;
  isRedeeming: boolean;
  isSuccess: boolean;
  errorMessage: string;
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  isOpen,
  onClose,
  reward,
  userPoints,
  onConfirmRedemption,
  isRedeeming,
  isSuccess,
  errorMessage
}) => {
  const [notes, setNotes] = useState('');

  if (!reward) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmRedemption(notes);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-3xl text-green-600"></i>
          </div>
          <h3 className="text-xl font-bold mb-2">¡Canje realizado con éxito!</h3>
          <p className="text-gray-600 mb-4">
            Recibirás un correo con los detalles de tu recompensa
          </p>
        </div>
      ) : isRedeeming ? (
        <div className="text-center py-10">
          <LoadingSpinner 
            size="lg" 
            theme="primary" 
            variant="dots" 
            message="Procesando tu canje..."
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-1">Confirmar canje</h3>
            <p className="text-gray-600">¿Estás seguro de que deseas canjear esta recompensa?</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-4">
                {reward.imageUrl ? (
                  <img 
                    src={reward.imageUrl} 
                    alt={reward.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-gift text-gray-400"></i>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold">{reward.name}</h4>
                <p className="text-yellow-600 text-sm font-medium">{reward.points} puntos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tus puntos actuales:</span>
              <span className="font-bold">{userPoints}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span>Puntos a deducir:</span>
              <span className="font-bold">-{reward.points}</span>
            </div>
            <div className="border-t border-gray-300 my-2 pt-2 flex justify-between items-center">
              <span className="font-medium">Puntos restantes:</span>
              <span className="font-bold">{userPoints - reward.points}</span>
            </div>
          </div>

          {/* Campos adicionales para el canje */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cualquier información adicional para este canje"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={2}
            ></textarea>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {errorMessage}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRedeeming}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRedeeming}
              className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50"
            >
              Confirmar canje
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RedemptionModal;
