'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RewardCarnetMascota } from '@/types/teller';

interface CanjeCarnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  recompensa: RewardCarnetMascota;
  onCanjeado: () => void;
}

const CanjeCarnetModal: React.FC<CanjeCarnetModalProps> = ({
  isOpen,
  onClose,
  recompensa,
  onCanjeado,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmarCanje = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewards/carnet-user/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recompensaId: recompensa.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onCanjeado();
        }, 1500);
      } else {
        setError(data.message || 'Error al canjear la recompensa');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si ha expirado
  const isExpirada = recompensa.fechaExpiracion
    ? new Date(recompensa.fechaExpiracion) < new Date()
    : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className={`${isExpirada ? 'bg-gray-500' : 'bg-gradient-to-r from-green-600 to-green-700'} p-6 text-center`}>
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
                {success ? (
                  <i className="fas fa-check text-4xl text-green-600"></i>
                ) : (
                  <i className={`fas fa-gift text-4xl ${isExpirada ? 'text-gray-400' : 'text-green-600'}`}></i>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {success ? '¡Canjeado!' : 'Canje de Recompensa'}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Tu recompensa ha sido canjeada correctamente. Presenta este código en tienda para reclamar tu saco de pienso gratis.
                  </p>
                  <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">
                      Ref: {recompensa.productBarcode || 'N/A'}
                    </p>
                    <p className="text-lg font-bold text-green-800 mt-2">
                      {recompensa.productNombre}
                    </p>
                  </div>
                </div>
              ) : isExpirada ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-times-circle text-3xl text-red-500"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Recompensa Expirada
                  </h3>
                  <p className="text-gray-600">
                    Lo sentimos, esta recompensa ha expirado el {new Date(recompensa.fechaExpiracion!).toLocaleDateString('es-ES')}.
                  </p>
                </div>
              ) : (
                <>
                  {/* Detalles de la recompensa */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-bold text-green-800 text-center mb-2">
                      {recompensa.productNombre}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mascota:</span>
                        <span className="font-medium">
                          {recompensa.petName}
                          {recompensa.petType && ` (${recompensa.petType})`}
                        </span>
                      </div>
                      {recompensa.productPvp && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valor:</span>
                          <span className="font-medium">
                            {typeof recompensa.productPvp === 'number' 
                              ? recompensa.productPvp.toFixed(2) 
                              : parseFloat(recompensa.productPvp).toFixed(2)} €
                          </span>
                        </div>
                      )}
                      {recompensa.fechaExpiracion && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expira:</span>
                          <span className="font-medium text-green-600">
                            {new Date(recompensa.fechaExpiracion).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mensaje de confirmación */}
                  <p className="text-center text-gray-600 mb-6">
                    ¿Estás seguro de que quieres canjear esta recompensa?
                  </p>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      {error}
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarCanje}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check mr-2"></i>
                          Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Botón de cerrar para éxito o expirada */}
              {(success || isExpirada) && (
                <button
                  onClick={onClose}
                  className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CanjeCarnetModal;