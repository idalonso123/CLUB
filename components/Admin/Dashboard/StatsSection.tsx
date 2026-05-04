import React from 'react';
import { motion } from 'framer-motion';
import StatsGroup from './StatsGroup';
import { useStats } from '@/components/Admin/Dashboard/hooks/useStats';

const StatsSection: React.FC = () => {
  const { stats, timeRange, isLoading, error, refetch } = useStats();
  
  // Formatear fechas para mostrar
  const formatDateRange = () => {
    if (!timeRange) return '';
    
    const startDate = new Date(timeRange.startDate);
    const endDate = new Date(timeRange.endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return `${startDate.toLocaleDateString('es-ES', formatOptions)} - ${endDate.toLocaleDateString('es-ES', formatOptions)}`;
  };
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estadísticas del Club</h2>
          <p className="text-sm text-gray-500">{formatDateRange()}</p>
        </div>
        <motion.button
          onClick={refetch}
          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Actualizar estadísticas"
          disabled={isLoading}
        >
          <i className={`fas fa-sync ${isLoading ? 'animate-spin' : ''}`}></i>
        </motion.button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex">
            <i className="fas fa-exclamation-circle mt-1 mr-2"></i>
            <span>{error?.message || 'Error desconocido'}</span>
          </div>
        </div>
      )}
      
      <StatsGroup stats={stats} loading={isLoading} />
    </div>
  );
};

export default StatsSection;