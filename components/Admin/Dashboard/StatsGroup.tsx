import React from 'react';
import { motion } from 'framer-motion';
import { StatData } from '@/types/stats';
import StatsCard from './StatsCard';

interface StatsGroupProps {
  stats: StatData[];
  loading?: boolean;
}

const StatsGroup: React.FC<StatsGroupProps> = ({
  stats,
  loading = false
}) => {
  // Asignar variantes a diferentes tipos de estadísticas
  const getVariant = (index: number, label: string) => {
    if (label.toLowerCase().includes('usuarios')) return 'primary';
    if (label.toLowerCase().includes('puntos')) return 'success';
    if (label.toLowerCase().includes('acciones')) return 'info';
    if (label.toLowerCase().includes('registros')) return 'warning';
    
    // Variantes por posición si no hay coincidencia
    const variants = ['primary', 'success', 'info', 'warning'];
    return variants[index % variants.length] as 'primary' | 'success' | 'info' | 'warning';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-36 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div 
          key={stat.label}
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <StatsCard 
            stat={stat} 
            variant={getVariant(index, stat.label)} 
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsGroup;