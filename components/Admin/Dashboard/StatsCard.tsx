import React from 'react';
import { motion } from 'framer-motion';
import { StatData } from '@/types/stats';

interface StatsCardProps {
  stat: StatData;
  variant?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger';
  animate?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  stat,
  variant = 'default',
  animate = true
}) => {
  // Determinar colores basados en la variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-800';
      case 'info':
        return 'bg-cyan-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Determinar colores del indicador de cambio
  const getChangeColor = () => {
    if (stat.changeType === 'increase') return 'text-green-600';
    if (stat.changeType === 'decrease') return 'text-red-600';
    return 'text-gray-500';
  };

  // Formatear el valor de cambio con signo
  const getFormattedChange = () => {
    if (stat.change === 0) return '';
    const prefix = stat.changeType === 'increase' ? '+' : '';
    return `${prefix}${Math.abs(stat.change).toFixed(1)}%`;
  };

  // Animación de contador
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    if (!animate) {
      setDisplayValue(stat.value);
      return;
    }

    let start = 0;
    const end = stat.value;
    const duration = 1000; // ms
    const startTime = performance.now();
    
    const animateCount = (timestamp: number) => {
      const runtime = timestamp - startTime;
      const progress = Math.min(runtime / duration, 1);
      
      // Función de easing para que la animación sea más natural
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentCount = Math.floor(easeProgress * (end - start) + start);
      setDisplayValue(currentCount);
      
      if (runtime < duration) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(end);
      }
    };
    
    requestAnimationFrame(animateCount);
  }, [stat.value, animate]);

  // Formatear el valor para mostrarlo
  const formattedValue = new Intl.NumberFormat().format(displayValue);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center mb-1">
        <div className={`w-12 h-12 rounded-lg ${getVariantClasses()} flex items-center justify-center text-white`}>
          <i className={`fas fa-${stat.icon} text-xl`}></i>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
          <div className="flex items-end">
            <p className="text-2xl font-bold text-gray-800">{formattedValue}</p>
            <span className={`ml-2 text-xs font-medium ${getChangeColor()}`}>
              {getFormattedChange()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;