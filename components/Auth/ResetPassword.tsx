import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Simulación de un retraso para mostrar el estado de carga
      await new Promise(resolve => setTimeout(resolve, 1000));

      // En lugar de enviar instrucciones, mostrar el modal de mantenimiento
      setShowMaintenanceModal(true);
    } catch (error) {
      setErrorMessage('Ha ocurrido un error al procesar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeMaintenanceModal = () => {
    setShowMaintenanceModal(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24, staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="flex flex-col items-center mt-20">
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm backdrop-filter flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Funcionalidad en Mantenimiento</h2>
              <p className="text-gray-600 mb-6">
                Lo sentimos, la funcionalidad de restablecimiento de contraseña se encuentra temporalmente en mantenimiento. Por favor, inténtalo más tarde o contacta con soporte para obtener ayuda.
              </p>
              <button 
                onClick={closeMaintenanceModal}
                className="inline-block px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div 
        className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border border-gray-200"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {!resetSent ? (
          <>
            <motion.div variants={itemVariants} className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-green-800">Restablecer Contraseña</h2>
              <p className="mt-2 text-gray-600 text-sm">
                Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
              </p>
            </motion.div>
            
            <motion.form 
              onSubmit={handleResetPassword} 
              className="space-y-4"
              variants={itemVariants}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
              
              {errorMessage && (
                <motion.div 
                  className="p-3 bg-red-50 text-red-700 text-sm rounded-md"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p>{errorMessage}</p>
                </motion.div>
              )}
              
              <motion.button
                type="submit"
                className="w-full p-3 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar instrucciones"
                )}
              </motion.button>
              
              <motion.div 
                className="text-center mt-2 text-sm"
                variants={itemVariants}
              >
                <Link 
                  href="/login" 
                  className="text-green-800 hover:underline hover:text-green-900 transition-colors"
                >
                  Volver a inicio de sesión
                </Link>
              </motion.div>
            </motion.form>
          </>
        ) : (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Instrucciones enviadas</h2>
            <p className="text-gray-600 mb-6">
              Hemos enviado un correo electrónico a <span className="font-medium">{email}</span> con las instrucciones para restablecer tu contraseña.
            </p>
            <Link 
              href="/login" 
              className="inline-block px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
            >
              Volver a inicio de sesión
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;