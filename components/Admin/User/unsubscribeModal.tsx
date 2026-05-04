import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/user';

interface UnsubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onConfirm: (user: User) => void;
  loading?: boolean;
}

const UnsubscribeModal: React.FC<UnsubscribeModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  loading = false
}) => {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con icono de advertencia */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Aviso Importante
          </h2>

          {/* Mensaje principal */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-center mb-4">
              <strong>{user.nombre || user.email}</strong>, estás a punto de darte de baja del sistema de correos de Club ViveVerde.
            </p>
            <p className="text-gray-700 text-center font-medium mb-4">
              Si te das de baja, perderás:
            </p>
            <ul className="text-gray-600 space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Acceso al sistema de puntos y recompensas</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Notificaciones sobre tus puntos acumulados</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Alertas de puntos próximos a caducar</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Descuentos exclusivos en tienda</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Ofertas especiales de recompensas</span>
              </li>
            </ul>
          </div>

          {/* Información del usuario */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            {user.phone && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Teléfono:</strong> {user.phone}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancelar - Mantener Suscripción
            </button>
            <button
              onClick={() => onConfirm(user)}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                'Darme de Baja Completamente'
              )}
            </button>
          </div>

          {/* Recordatorio legal */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Al darte de baja, se cancelará tu suscripción a todas las comunicaciones del Club ViveVerde, incluyendo las relacionadas con tu cuenta de puntos y recompensas.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnsubscribeModal;
