import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Common/Modal/Modal';
import useConfig, { ClientLevel } from '@/components/Admin/Config/hooks/useConfig';
import { Reward } from '@/types/rewards';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  // Estado para controlar las pestañas
  const [activeTab, setActiveTab] = useState('points'); // 'points', 'rewards', 'expiration' o 'levels'
  
  // Usar el hook de configuración
  const { 
    config, 
    updateConfig,
    updateClientLevel, 
    loadConfig, 
    saveConfig, 
    isLoading, 
    isSaving 
  } = useConfig();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

  // Cargar la configuración al abrir el modal
  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const response = await fetch('/api/rewards?available=true');
      if (!response.ok) {
        throw new Error('Error al cargar recompensas');
      }
      const data = await response.json();
      if (data.success) {
        setRewards(data.rewards);
      } else {
        throw new Error(data.message || 'Error al cargar recompensas');
      }
    } catch (error) {
      console.error('Error al cargar recompensas:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      fetchRewards();
    }
  }, [isOpen, loadConfig]);

  // Función para manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convertir a número y validar
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      updateConfig({
        [name]: numericValue
      });
    }
  };

  // Función para incrementar/decrementar valor con paso configurable
  const handleIncrement = (step: number = 0.1) => {
    // Asegurar que eurosPorPunto sea un número
    const currentValue = typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5;
    updateConfig({
      eurosPorPunto: parseFloat((currentValue + step).toFixed(2))
    });
  };

  const handleDecrement = (step: number = 0.1) => {
    // Asegurar que eurosPorPunto sea un número
    const currentValue = typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5;
    updateConfig({
      eurosPorPunto: Math.max(parseFloat((currentValue - step).toFixed(2)), 0.01)
    });
  };

  const handleRewardSelectionChange = (rewardId: number) => {
    if (config.tellerRewards?.rewardIds?.includes(rewardId)) {
      updateConfig({
        tellerRewards: {
          ...config.tellerRewards,
          rewardIds: config.tellerRewards.rewardIds.filter(id => id !== rewardId)
        }
      });
    } else {
      updateConfig({
        tellerRewards: {
          ...config.tellerRewards,
          rewardIds: [...(config.tellerRewards?.rewardIds || []), rewardId]
        }
      });
    }
  };

  const handleShowAllRewardsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      tellerRewards: {
        ...config.tellerRewards,
        showAllRewards: e.target.checked
      }
    });
  };

  // Función para manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await saveConfig();
    if (success) {
      onClose();
    }
  };

  // Obtener la evaluación de generosidad basada en el valor
  const getGenerosityLevel = () => {
    // Asegurar que eurosPorPunto sea un número válido
    const euroValue = typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5;
    
    if (euroValue > 5) return {
      text: 'Pocos puntos por compra',
      className: 'bg-red-50 text-red-800'
    };
    if (euroValue > 3.5) return {
      text: 'Puntos moderados',
      className: 'bg-yellow-50 text-yellow-800'
    };
    return {
      text: 'Generoso en puntos',
      className: 'bg-green-50 text-green-800'
    };
  };

  const generosityInfo = getGenerosityLevel();

  // Variantes para animaciones
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  // Spinner animado para los estados de carga
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" as const }}
        >
          <svg className="w-12 h-12 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </motion.div>
      </div>
      <p className="mt-4 text-green-800 font-medium text-center">Cargando configuración...</p>
    </div>
  );



  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Configuración del Sistema"
      maxWidth="max-w-md"
    >
      <div className="p-1">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6" 
            initial="hidden"
            animate="visible"
            variants={formVariants}
          >
            {/* Tabs de navegación */}
            <div className="w-full mb-6">
              <div className="flex flex-wrap border-b border-gray-200">
                <button
                  type="button" 
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium inline-flex items-center whitespace-nowrap transition-colors duration-200 flex-1 sm:flex-none justify-center sm:justify-start ${activeTab === 'points' 
                    ? 'text-green-800 border-b-2 border-green-800' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('points')}
                >
                  <i className="fas fa-coins mr-1 sm:mr-2"></i>
                  <span>Sistema de Puntos</span>
                </button>
                <button
                  type="button"
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium inline-flex items-center whitespace-nowrap transition-colors duration-200 flex-1 sm:flex-none justify-center sm:justify-start ${activeTab === 'rewards' 
                    ? 'text-green-800 border-b-2 border-green-800' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('rewards')}
                >
                  <i className="fas fa-gift mr-1 sm:mr-2"></i>
                  <span>Recompensas</span>
                </button>
                <button
                  type="button"
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium inline-flex items-center whitespace-nowrap transition-colors duration-200 flex-1 sm:flex-none justify-center sm:justify-start ${activeTab === 'expiration' 
                    ? 'text-green-800 border-b-2 border-green-800' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('expiration')}
                >
                  <i className="fas fa-clock mr-1 sm:mr-2"></i>
                  <span>Caducidades</span>
                </button>
                <button
                  type="button"
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium inline-flex items-center whitespace-nowrap transition-colors duration-200 flex-1 sm:flex-none justify-center sm:justify-start ${activeTab === 'levels' 
                    ? 'text-green-800 border-b-2 border-green-800' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('levels')}
                >
                  <i className="fas fa-layer-group mr-1 sm:mr-2"></i>
                  <span>Niveles</span>
                </button>
              </div>
            </div>
            
            {/* Contenido de la pestaña de Puntos */}
            {activeTab === 'points' && (
              <div>
                {/* Header explicativo */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-green-800 flex items-center mb-2">
                    <i className="fas fa-cog mr-2"></i>
                    Configuración de Puntos
                  </h3>
                  <p className="text-xs text-green-700">
                    Establece la tasa de conversión entre euros gastados y puntos otorgados a los usuarios.
                    Este valor representa cuántos euros debe gastar un cliente para recibir 1 punto.
                    Esta configuración afecta a todas las nuevas compras registradas en el sistema.
                  </p>
                </div>

                {/* Texto informativo */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
                  <h3 className="text-sm font-semibold text-green-800 flex items-center mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Información de conversión
                  </h3>
                  <p className="text-xs text-green-700">
                    Con la configuración actual, los clientes recibirán <span className="font-bold">1 punto</span> por cada <span className="font-bold">{typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5}€</span> gastados.
                    Esto equivale a <span className="font-semibold">{Math.floor(100 / (typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5))} puntos</span> por cada 100€ de compra.
                  </p>
                </div>
                      
                {/* Configuración de euros por punto */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="eurosPorPunto" className="block text-sm font-medium text-gray-700 flex items-center">
                        <i className="fas fa-euro-sign mr-2 text-green-600"></i>
                        Euros por Punto
                      </label>
                      <span className={`text-xs px-3 py-1 rounded-full ${generosityInfo.className} font-medium shadow-sm`}>
                        {generosityInfo.text}
                      </span>
                    </div>

                    {/* Control numérico mejorado */}
                    <div className="space-y-4 mt-3">
                      {/* Control principal con incrementos mayores/menores */}
                      <div className="flex items-center">
                        <motion.button
                          type="button"
                          onClick={() => handleDecrement(1)}
                          className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                          disabled={(typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5) <= 1}
                        >
                          <i className="fas fa-minus-circle text-gray-600"></i>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => handleDecrement(0.1)}
                          className="px-2 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border-t border-b border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                          disabled={(typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5) <= 0.1}
                        >
                          <i className="fas fa-minus text-gray-600"></i>
                        </motion.button>
                        <input
                          type="number"
                          id="eurosPorPunto"
                          name="eurosPorPunto"
                          value={typeof config.eurosPorPunto === 'number' ? config.eurosPorPunto : parseFloat(config.eurosPorPunto) || 3.5}
                          onChange={handleChange}
                          step="0.1"
                          min="0.1"
                          className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                        <motion.button
                          type="button"
                          onClick={() => handleIncrement(0.1)}
                          className="px-2 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border-t border-b border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-plus text-gray-600"></i>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => handleIncrement(1)}
                          className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-plus-circle text-gray-600"></i>
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          type="button"
                          onClick={() => handleDecrement(0.01)}
                          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-xs"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                          disabled={config.eurosPorPunto <= 0.01}
                        >
                          -0.01
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({ eurosPorPunto: 3.5 })}
                          className="px-2 py-1 bg-green-100 rounded hover:bg-green-200 text-green-800 border border-green-300 text-xs font-medium"
                          whileHover={{ backgroundColor: "#dcfce7" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          3.50
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => handleIncrement(0.01)}
                          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-xs"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          +0.01
                        </motion.button>
                      </div>
                    </div>

                    {/* Feedback visual */}
                    <div className="mt-4 text-sm">
                      <div className={`flex justify-between items-center p-3 rounded-md ${generosityInfo.className} shadow-sm`}>
                        <span className="flex items-center">
                          <i className={`fas ${config.eurosPorPunto <= 3.5 ? 'fa-smile' : config.eurosPorPunto <= 5 ? 'fa-meh' : 'fa-frown'} mr-2`}></i>
                          {generosityInfo.text}
                        </span>
                        <span className="font-medium bg-white bg-opacity-50 px-2 py-1 rounded-md">
                          {Math.floor(100 / config.eurosPorPunto)} puntos por 100€
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-6">
                    <div className="flex items-center justify-between">
                      <label htmlFor="puntosBienvenida" className="block text-sm font-medium text-gray-700 flex items-center">
                        <i className="fas fa-gift mr-2 text-green-600"></i>
                        Puntos de bienvenida
                      </label>
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium shadow-sm">
                        Nuevos usuarios
                      </span>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-3 mb-3">
                      <p className="text-xs text-green-700">
                        Define cuántos puntos recibirán automáticamente los nuevos usuarios al registrarse en la plataforma.
                      </p>
                    </div>
                    
                    {/* Control numérico mejorado para puntos de bienvenida */}
                    <div className="space-y-4 mt-3">
                      {/* Control principal con incrementos */}
                      <div className="flex items-center">
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: Math.max(0, config.puntosBienvenida - 5)})}
                          className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                          disabled={config.puntosBienvenida < 5}
                        >
                          <i className="fas fa-minus-circle text-gray-600"></i>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: Math.max(0, config.puntosBienvenida - 1)})}
                          className="px-2 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border-t border-b border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                          disabled={config.puntosBienvenida <= 0}
                        >
                          <i className="fas fa-minus text-gray-600"></i>
                        </motion.button>
                        <input
                          type="number"
                          id="puntosBienvenida"
                          name="puntosBienvenida"
                          value={config.puntosBienvenida}
                          onChange={(e) => {
                            // Solo permitir números enteros
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              updateConfig({ puntosBienvenida: parseInt(value) || 0 });
                            }
                          }}
                          onKeyDown={(e) => {
                            // Prevenir entrada de punto decimal o coma
                            if (e.key === '.' || e.key === ',') {
                              e.preventDefault();
                            }
                          }}
                          step="1"
                          min="0"
                          className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: config.puntosBienvenida + 1})}
                          className="px-2 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border-t border-b border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-plus text-gray-600"></i>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: config.puntosBienvenida + 5})}
                          className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-plus-circle text-gray-600"></i>
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: 0})}
                          className={`px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-xs ${config.puntosBienvenida === 0 ? 'bg-green-600 text-white border-green-700' : ''}`}
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          0
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: 5})}
                          className={`px-2 py-1 ${config.puntosBienvenida === 5 ? 'bg-green-600 text-white border-green-700' : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'} rounded text-xs font-medium`}
                          whileHover={config.puntosBienvenida !== 5 ? { backgroundColor: "#dcfce7" } : {}}
                          whileTap={{ scale: 0.95 }}
                        >
                          5
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: 10})}
                          className={`px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-xs ${config.puntosBienvenida === 10 ? 'bg-green-600 text-white border-green-700' : ''}`}
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          10
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({puntosBienvenida: 20})}
                          className={`px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-xs ${config.puntosBienvenida === 20 ? 'bg-green-600 text-white border-green-700' : ''}`}
                          whileHover={{ backgroundColor: "#e5e7eb" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          20
                        </motion.button>
                      </div>
                    </div>

                    {/* Feedback visual */}
                    <div className="mt-4 text-sm">
                      <div className="flex justify-between items-center p-3 rounded-md bg-green-50 text-green-800 shadow-sm">
                        <span className="flex items-center">
                          <i className="fas fa-info-circle mt-0.5 mr-2"></i>
                          <span>Puntos de bienvenida: <strong>{config.puntosBienvenida}</strong></span>
                        </span>
                        <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-md">
                          Los clientes antiguos mantienen sus puntos previos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido de la pestaña de Recompensas */}
              {activeTab === 'rewards' && (
                <div>
                  {/* Header explicativo */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-green-800 flex items-center mb-2">
                      <i className="fas fa-gift mr-2"></i>
                      Configuración de Recompensas
                    </h3>
                    <p className="text-xs text-green-700">
                      Configura qué recompensas estarán disponibles en el sistema de cajero para ser canjeadas por puntos.
                      Puedes mostrar todas las recompensas disponibles o seleccionar manualmente cuáles mostrar.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-green-700 flex items-center">
                        <i className="fas fa-gift mr-2 text-green-600"></i>
                        Recompensas Visibles en Cajero
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {config.tellerRewards?.showAllRewards ? 'Todas visibles' : `${config.tellerRewards?.rewardIds?.length || 0} de ${rewards.length}`}
                      </span>
                    </div>
                    
                    <div className="mb-5 bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200 shadow-sm">
                      <label className="flex items-center text-sm text-green-800 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.tellerRewards?.showAllRewards || false}
                          onChange={handleShowAllRewardsChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2"
                        />
                        Mostrar todas las recompensas disponibles
                      </label>
                      <p className="text-xs text-green-700 mt-1 ml-6">
                        {config.tellerRewards?.showAllRewards 
                          ? 'Todas las recompensas disponibles serán visibles en el cajero.' 
                          : 'Solo las recompensas seleccionadas a continuación serán visibles en el cajero.'}
                      </p>
                    </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                    {loadingRewards ? (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" as const }}
                          className="mr-2"
                        >
                          <i className="fas fa-circle-notch text-green-600 text-lg"></i>
                        </motion.div>
                        <span>Cargando recompensas...</span>
                      </div>
                    ) : rewards.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <i className="fas fa-exclamation-circle text-xl mb-2 text-gray-400"></i>
                        <p>No hay recompensas disponibles</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {rewards.map((reward) => (
                          <li key={reward.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <label className="flex items-start cursor-pointer p-3 w-full">
                              <div className="flex items-center h-5 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={config.tellerRewards?.rewardIds?.includes(reward.id) || false}
                                  onChange={() => handleRewardSelectionChange(reward.id)}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  disabled={config.tellerRewards?.showAllRewards || false}
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-800">{reward.name}</span>
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                    {reward.points} puntos
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{reward.description}</p>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {!config.tellerRewards?.showAllRewards && (
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-info-circle mr-1 text-green-600"></i>
                        {config.tellerRewards?.rewardIds?.length || 0} recompensas seleccionadas
                      </p>
                      {(config.tellerRewards?.rewardIds?.length || 0) > 0 && (
                        <motion.button
                          type="button"
                          onClick={() => updateConfig({tellerRewards: {...config.tellerRewards, rewardIds: []}})}  
                          className="text-xs text-red-600 hover:text-red-800"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-times-circle mr-1"></i>
                          Deseleccionar todas
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contenido de la pestaña de Caducidades */}
            {activeTab === 'expiration' && (
              <div>
                {/* Header explicativo */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center mb-2">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Configuración de Caducidades
                  </h3>
                  <p className="text-xs text-amber-700">
                    Configura el tiempo de caducidad para puntos y carnets de mascota. 
                    <strong> Al cambiar estos valores se actualizarán TODOS los registros existentes</strong> (Opción B).
                    Cada punto ganado tiene su propia fecha de caducidad calculada desde la fecha de obtención.
                  </p>
                </div>

                {/* Configuración de caducidad de puntos por antigüedad */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="caducidad_puntos_meses" className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fas fa-coins mr-2 text-amber-600"></i>
                      Caducidad de Puntos
                    </label>
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium shadow-sm">
                      Sistema de Puntos
                    </span>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-3 mb-3">
                    <p className="text-xs text-amber-700">
                      Define cuántos meses duran los puntos antes de caducar. Los puntos de cada usuario tienen su propia fecha de caducidad a partir de cuando se obtienen.
                    </p>
                  </div>
                  
                  {/* Control numérico mejorado */}
                  <div className="space-y-4 mt-3">
                    <div className="flex items-center">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: Math.max(1, config.expiration.caducidad_puntos_meses - 1) 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                        disabled={config.expiration.caducidad_puntos_meses <= 1}
                      >
                        <i className="fas fa-minus text-gray-600"></i>
                      </motion.button>
                      <input
                        type="number"
                        id="caducidad_puntos_meses"
                        name="caducidad_puntos_meses"
                        value={config.expiration.caducidad_puntos_meses}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            updateConfig({ 
                              expiration: { 
                                ...config.expiration, 
                                caducidad_puntos_meses: value 
                              }
                            });
                          }
                        }}
                        step="1"
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      />
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: config.expiration.caducidad_puntos_meses + 1 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-plus text-gray-600"></i>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: 6 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_puntos_meses === 6 ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        6 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: 12 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_puntos_meses === 12 ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        12 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: 18 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_puntos_meses === 18 ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        18 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_puntos_meses: 24 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_puntos_meses === 24 ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        24 meses
                      </motion.button>
                    </div>
                  </div>

                  {/* Ejemplo visual */}
                  <div className="mt-4 text-sm">
                    <div className="flex justify-between items-center p-3 rounded-md bg-amber-50 text-amber-800 shadow-sm">
                      <span className="flex items-center">
                        <i className="fas fa-lightbulb mr-2 text-amber-600"></i>
                        Ejemplo:
                      </span>
                      <span className="font-medium bg-white bg-opacity-50 px-2 py-1 rounded-md">
                        Puntos obtenidos hoy caducan el {new Date(Date.now() + config.expiration.caducidad_puntos_meses * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Configuración de caducidad de carnet por inactividad */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="caducidad_carnet_inactividad_meses" className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fas fa-paw mr-2 text-orange-600"></i>
                      Caducidad Carnet (Inactividad)
                    </label>
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium shadow-sm">
                      Carnets Mascota
                    </span>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-3 mb-3">
                    <p className="text-xs text-orange-700">
                      Define cuántos meses tiene el usuario para añadir un nuevo sello antes de que el carnet caduque por inactividad. El temporizador se reinicia con cada sello.
                    </p>
                  </div>
                  
                  {/* Control numérico mejorado */}
                  <div className="space-y-4 mt-3">
                    <div className="flex items-center">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: Math.max(1, config.expiration.caducidad_carnet_inactividad_meses - 1) 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                        disabled={config.expiration.caducidad_carnet_inactividad_meses <= 1}
                      >
                        <i className="fas fa-minus text-gray-600"></i>
                      </motion.button>
                      <input
                        type="number"
                        id="caducidad_carnet_inactividad_meses"
                        name="caducidad_carnet_inactividad_meses"
                        value={config.expiration.caducidad_carnet_inactividad_meses}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            updateConfig({ 
                              expiration: { 
                                ...config.expiration, 
                                caducidad_carnet_inactividad_meses: value 
                              }
                            });
                          }
                        }}
                        step="1"
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: config.expiration.caducidad_carnet_inactividad_meses + 1 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-plus text-gray-600"></i>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: 3 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_inactividad_meses === 3 ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        3 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: 6 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_inactividad_meses === 6 ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        6 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: 9 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_inactividad_meses === 9 ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        9 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_inactividad_meses: 12 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_inactividad_meses === 12 ? 'bg-orange-600 text-white border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        12 meses
                      </motion.button>
                    </div>
                  </div>

                  {/* Ejemplo visual */}
                  <div className="mt-4 text-sm">
                    <div className="flex justify-between items-center p-3 rounded-md bg-orange-50 text-orange-800 shadow-sm">
                      <span className="flex items-center">
                        <i className="fas fa-lightbulb mr-2 text-orange-600"></i>
                        Ejemplo:
                      </span>
                      <span className="font-medium bg-white bg-opacity-50 px-2 py-1 rounded-md text-xs">
                        Sello añadido hoy: próximo sello antes del {new Date(Date.now() + config.expiration.caducidad_carnet_inactividad_meses * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Configuración de caducidad de carnet por antigüedad */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="caducidad_carnet_antiguedad_meses" className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fas fa-history mr-2 text-red-600"></i>
                      Caducidad Carnet (Antigüedad)
                    </label>
                    <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium shadow-sm">
                      Límite Máximo
                    </span>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-3 mb-3">
                    <p className="text-xs text-red-700">
                      Define la antigüedad máxima de un carnet de mascota, independientemente de la actividad. Si un carnet se crea y nunca se completa, será eliminado tras este periodo.
                    </p>
                  </div>
                  
                  {/* Control numérico mejorado */}
                  <div className="space-y-4 mt-3">
                    <div className="flex items-center">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_antiguedad_meses: Math.max(1, config.expiration.caducidad_carnet_antiguedad_meses - 6) 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                        disabled={config.expiration.caducidad_carnet_antiguedad_meses <= 6}
                      >
                        <i className="fas fa-minus text-gray-600"></i>
                      </motion.button>
                      <input
                        type="number"
                        id="caducidad_carnet_antiguedad_meses"
                        name="caducidad_carnet_antiguedad_meses"
                        value={config.expiration.caducidad_carnet_antiguedad_meses}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            updateConfig({ 
                              expiration: { 
                                ...config.expiration, 
                                caducidad_carnet_antiguedad_meses: value 
                              }
                            });
                          }
                        }}
                        step="6"
                        min="6"
                        className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      />
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_antiguedad_meses: config.expiration.caducidad_carnet_antiguedad_meses + 6 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-plus text-gray-600"></i>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_antiguedad_meses: 12 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_antiguedad_meses === 12 ? 'bg-red-600 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        12 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_antiguedad_meses: 24 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_antiguedad_meses === 24 ? 'bg-red-600 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        24 meses
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            caducidad_carnet_antiguedad_meses: 36 
                          }
                        })}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.caducidad_carnet_antiguedad_meses === 36 ? 'bg-red-600 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        36 meses
                      </motion.button>
                    </div>
                  </div>

                  {/* Ejemplo visual */}
                  <div className="mt-4 text-sm">
                    <div className="flex justify-between items-center p-3 rounded-md bg-red-50 text-red-800 shadow-sm">
                      <span className="flex items-center">
                        <i className="fas fa-lightbulb mr-2 text-red-600"></i>
                        Ejemplo:
                      </span>
                      <span className="font-medium bg-white bg-opacity-50 px-2 py-1 rounded-md text-xs">
                        Carnet creado hoy caduca el {new Date(Date.now() + config.expiration.caducidad_carnet_antiguedad_meses * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Advertencia importante */}
                <div className="bg-red-100 p-4 rounded-lg border border-red-300 mt-4">
                  <h4 className="text-sm font-semibold text-red-800 flex items-center mb-2">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    Advertencia Importante
                  </h4>
                  <p className="text-xs text-red-700">
                    Al guardar estos cambios, se actualizarán <strong>TODOS los registros existentes</strong> de puntos y carnets de mascota para que utilicen las nuevas fechas de caducidad. Esta acción no se puede deshacer.
                  </p>
                </div>

                {/* Configuración de sellos requeridos para completar el carnet */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="sellos_requeridos_carnet" className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fas fa-stamp mr-2 text-blue-600"></i>
                      Sellos Requeridos para Completar el Carnet
                    </label>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium shadow-sm">
                      Carnets Mascota
                    </span>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-3 mb-3">
                    <p className="text-xs text-blue-700">
                      Define cuántos sellos debe tener un carnet de mascota para considerarse completo y recibir un saco gratuito.
                    </p>
                  </div>
                  
                  {/* Control numérico mejorado */}
                  <div className="space-y-4 mt-3">
                    <div className="flex items-center">
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            sellos_requeridos_carnet: Math.max(1, config.expiration.sellos_requeridos_carnet - 1) 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                        disabled={config.expiration.sellos_requeridos_carnet <= 1}
                      >
                        <i className="fas fa-minus text-gray-600"></i>
                      </motion.button>
                      <input
                        type="number"
                        id="sellos_requeridos_carnet"
                        name="sellos_requeridos_carnet"
                        value={config.expiration.sellos_requeridos_carnet}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1 && value <= 20) {
                            updateConfig({ 
                              expiration: { 
                                ...config.expiration, 
                                sellos_requeridos_carnet: value 
                              }
                            });
                          }
                        }}
                        step="1"
                        min="1"
                        max="20"
                        className="block w-full px-3 py-2 border border-gray-300 text-center focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <motion.button
                        type="button"
                        onClick={() => updateConfig({ 
                          expiration: { 
                            ...config.expiration, 
                            sellos_requeridos_carnet: Math.min(20, config.expiration.sellos_requeridos_carnet + 1) 
                          }
                        })}
                        className="px-2 py-2 bg-gray-100 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                        whileHover={{ backgroundColor: "#e5e7eb" }}
                        whileTap={{ scale: 0.95 }}
                        disabled={config.expiration.sellos_requeridos_carnet >= 20}
                      >
                        <i className="fas fa-plus text-gray-600"></i>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[4, 5, 6, 8, 10].map((num) => (
                        <motion.button
                          key={num}
                          type="button"
                          onClick={() => updateConfig({ 
                            expiration: { 
                              ...config.expiration, 
                              sellos_requeridos_carnet: num 
                            }
                          })}
                          className={`px-2 py-1 rounded text-xs font-medium ${config.expiration.sellos_requeridos_carnet === num ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {num} sellos
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Ejemplo visual */}
                  <div className="mt-4 text-sm">
                    <div className="flex justify-between items-center p-3 rounded-md bg-blue-50 text-blue-800 shadow-sm">
                      <span className="flex items-center">
                        <i className="fas fa-lightbulb mr-2 text-blue-600"></i>
                        Ejemplo:
                      </span>
                      <span className="font-medium bg-white bg-opacity-50 px-2 py-1 rounded-md text-xs">
                        Con {config.expiration.sellos_requeridos_carnet} compras selladas, el siguiente saco es gratis
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido de la pestaña de Niveles de Cliente */}
            {activeTab === 'levels' && (
              <div>
                {/* Header explicativo */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-purple-800 flex items-center mb-2">
                    <i className="fas fa-layer-group mr-2"></i>
                    Configuración de Niveles de Cliente
                  </h3>
                  <p className="text-xs text-purple-700">
                    Define los puntos necesarios y la compra mínima semestral para cada nivel de cliente.
                    Los niveles deben ser crecientes y no pueden solaparse.
                  </p>
                </div>

                {/* Lista de niveles */}
                <div className="space-y-4 mt-4">
                  {config.clientLevels && config.clientLevels.length > 0 ? (
                    config.clientLevels
                      .sort((a, b) => a.nivel - b.nivel)
                      .map((level) => (
                        <div 
                          key={level.nivel} 
                          className={`bg-white rounded-lg p-4 border-2 ${
                            level.nivel === 1 ? 'border-amber-300' :
                            level.nivel === 2 ? 'border-green-300' :
                            level.nivel === 3 ? 'border-emerald-300' :
                            'border-pink-300'
                          } shadow-sm`}
                        >
                          {/* Header del nivel */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{level.icono}</span>
                              <span className="font-semibold text-gray-800">{level.nombre}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              level.nivel === 1 ? 'bg-amber-100 text-amber-800' :
                              level.nivel === 2 ? 'bg-green-100 text-green-800' :
                              level.nivel === 3 ? 'bg-emerald-100 text-emerald-800' :
                              'bg-pink-100 text-pink-800'
                            }`}>
                              Nivel {level.nivel}
                            </span>
                          </div>

                          {/* Campos editables */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Puntos mínimos */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Puntos mínimos
                              </label>
                              <input
                                type="number"
                                value={level.puntosMinimos}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  updateClientLevel(level.nivel, { puntosMinimos: value });
                                }}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              />
                            </div>

                            {/* Puntos máximos */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Puntos máximos (vacío = sin límite)
                              </label>
                              <input
                                type="number"
                                value={level.puntosMaximos === null ? '' : level.puntosMaximos}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateClientLevel(level.nivel, { puntosMaximos: value === '' ? null : (parseInt(value) || 0) });
                                }}
                                min="0"
                                placeholder="∞"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              />
                            </div>

                            {/* Compra mínima */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Compra mínima semestral (€)
                              </label>
                              <input
                                type="number"
                                value={level.eurosCompraMinima}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  updateClientLevel(level.nivel, { eurosCompraMinima: value });
                                }}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              />
                            </div>
                          </div>

                          {/* Rango de puntos */}
                          <div className="mt-2 text-xs text-gray-500">
                            Rango: {level.puntosMinimos} - {level.puntosMaximos === null ? '∞' : level.puntosMaximos} puntos
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        No se encontraron niveles configurados. Por favor, contacta con el administrador.
                      </p>
                    </div>
                  )}
                </div>

                {/* Advertencia sobre validación */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
                  <h4 className="text-sm font-semibold text-purple-800 flex items-center mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Información importante
                  </h4>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• El primer nivel debe tener puntos mínimos en 0</li>
                    <li>• Los niveles deben ser consecutivos y no pueden solaparse</li>
                    <li>• El último nivel puede tener puntos máximos ilimitados (dejar vacío)</li>
                    <li>• La compra mínima debe ser creciente para cada nivel</li>
                  </ul>
                </div>

                {/* Preview de los niveles */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center mb-3">
                    <i className="fas fa-eye mr-2"></i>
                    Vista previa
                  </h4>
                  <div className="space-y-2">
                    {config.clientLevels && config.clientLevels.length > 0 && (
                      config.clientLevels
                        .sort((a, b) => a.nivel - b.nivel)
                        .map((level) => (
                          <div 
                            key={`preview-${level.nivel}`}
                            className="flex items-center justify-between text-sm bg-white p-2 rounded"
                          >
                            <div className="flex items-center">
                              <span className="mr-2">{level.icono}</span>
                              <span className="font-medium">{level.nombre}</span>
                            </div>
                            <div className="text-gray-600">
                              {level.puntosMinimos} - {level.puntosMaximos === null ? '∞' : level.puntosMaximos} pts
                              {' | '}
                              {level.eurosCompraMinima === 0 ? 'Sin mín.' : `${level.eurosCompraMinima}€ mín.`}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <motion.button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isSaving 
                    ? 'bg-green-600 cursor-not-allowed' 
                    : 'bg-green-700 hover:bg-green-800'
                }`}
                variants={buttonVariants}
                whileHover={isSaving ? undefined : "hover"}
                whileTap={isSaving ? undefined : "tap"}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Guardar cambios
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>
    </Modal>
  );
};

export default ConfigModal;