import React from 'react';
import { motion } from 'framer-motion';

interface EmailSectionProps {
  isComingSoon?: boolean;
}

const EmailSection: React.FC<EmailSectionProps> = ({ isComingSoon = true }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1 
        className="text-2xl font-bold text-green-800"
        variants={itemVariants}
      >
        Gestión de Correos
      </motion.h1>
      
      {isComingSoon ? (
        <motion.div 
          className="bg-white p-8 rounded-lg shadow-sm text-center"
          variants={itemVariants}
        >
          <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <i className="fas fa-envelope text-yellow-600 text-4xl"></i>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Próximamente: Sistema de Gestión de Correos
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Estamos trabajando en un completo sistema para enviar correos personalizados, 
            boletines informativos y comunicados a tus usuarios.
          </p>
          
          <div className="text-left max-w-md mx-auto space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <strong>Plantillas personalizables</strong> para diferentes tipos de comunicaciones.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <strong>Segmentación de usuarios</strong> por intereses, actividad y puntos acumulados.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <strong>Estadísticas detalladas</strong> de apertura y engagement con tus comunicaciones.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <strong>Automatizaciones</strong> basadas en comportamiento y fechas especiales.
                </p>
              </div>
            </div>
          </div>
          
          <motion.button
            className="mt-8 px-6 py-3 bg-gray-200 text-gray-500 cursor-not-allowed rounded-md font-medium flex items-center justify-center mx-auto"
            whileHover={{ scale: 1.0 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <i className="fas fa-clock mr-2"></i>
            Disponible pronto
          </motion.button>
        </motion.div>
      ) : (
        // Implementación futura del sistema de correos cuando esté disponible
        <motion.div 
          className="bg-white p-8 rounded-lg shadow-sm"
          variants={itemVariants}
        >
          <p className="text-gray-600">
            Aquí irá el sistema de gestión de correos cuando esté disponible.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default EmailSection;