import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Common/Modal/Modal';
import useConfig from '@/components/Admin/Config/hooks/useConfig';
import { Reward } from '@/types/rewards';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  // Estado para controlar las pestañas
  const [activeTab, setActiveTab] = useState('points'); // 'points' o 'rewards'
  
  // Usar el hook de configuración
  const { 
    config, 
    updateConfig, 
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