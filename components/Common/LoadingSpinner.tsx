import React from 'react';
import { motion, Variants } from 'framer-motion';

interface LoadingSpinnerProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Tema del spinner */
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  /** Tipo de spinner */
  variant?: 'circle' | 'dots' | 'pulse' | 'leaf';
  /** Mensaje a mostrar durante la carga */
  message?: string;
  /** Si el spinner debe ocupar toda la pantalla */
  fullScreen?: boolean;
  /** Si debe mostrar un fondo con overlay */
  overlay?: boolean;
  /** Clases adicionales para el contenedor */
  className?: string;
}

/**
 * Componente de LoadingSpinner mejorado con múltiples variantes y opciones
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  theme = 'primary',
  variant = 'circle',
  message,
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  // Clases de tamaño para los diferentes variantes
  const sizeClasses = {
    sm: {
      container: 'h-8 w-8',
      dot: 'h-2 w-2',
      text: 'text-xs'
    },
    md: {
      container: 'h-12 w-12',
      dot: 'h-3 w-3',
      text: 'text-sm'
    },
    lg: {
      container: 'h-16 w-16',
      dot: 'h-4 w-4',
      text: 'text-base'
    },
    xl: {
      container: 'h-24 w-24',
      dot: 'h-5 w-5',
      text: 'text-lg'
    }
  };

  // Clases de color según el tema
  const themeClasses = {
    primary: {
      border: 'border-green-500',
      bg: 'bg-green-500',
      text: 'text-green-800'
    },
    secondary: {
      border: 'border-purple-500',
      bg: 'bg-purple-500',
      text: 'text-purple-800'
    },
    success: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500',
      text: 'text-emerald-800'
    },
    warning: {
      border: 'border-amber-500',
      bg: 'bg-amber-500',
      text: 'text-amber-800'
    },
    info: {
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      text: 'text-blue-800'
    }
  };

  // Animaciones para los diferentes elementos
  const containerAnimation: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  // Variante de puntos (dots)
  const dotsAnimation: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotAnimation: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  };

  // Variante de pulso (pulse)
  const pulseAnimation: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  };

  // Variante de hoja (leaf)
  const leafAnimation: Variants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Determinar las clases de contenedor
  const containerClasses = `
    ${fullScreen ? 'fixed inset-0 z-50' : 'h-64'} 
    ${overlay ? 'bg-white/80 backdrop-blur-sm' : ''}
    flex flex-col justify-center items-center
    ${className}
  `;

  // Renderizar la variante correcta del spinner
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <motion.div 
            className="flex space-x-2"
            variants={dotsAnimation}
            animate="animate"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${sizeClasses[size].dot} rounded-full ${themeClasses[theme].bg}`}
                variants={dotAnimation}
                animate="animate"
                style={{ animationDelay: `${index * 0.15}s` }}
              />
            ))}
          </motion.div>
        );
      
      case 'pulse':
        return (
          <motion.div 
            className={`${sizeClasses[size].container} rounded-full ${themeClasses[theme].bg}`}
            variants={pulseAnimation}
            animate="animate"
          />
        );
      
      case 'leaf':
        return (
          <motion.div
            className={`${sizeClasses[size].container} flex items-center justify-center`}
            variants={leafAnimation}
            animate="animate"
          >
            <svg 
              className={`h-full w-full text-green-500`} 
              viewBox="0 0 24 24" 
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path 
                d="M12 9L15 12L12 15L9 12L12 9Z" 
                fill="currentColor" 
              />
            </svg>
          </motion.div>
        );
          
      case 'circle':
      default:
        return (
          <div className={`${sizeClasses[size].container} relative`}>
            <div className={`absolute inset-0 rounded-full ${themeClasses[theme].border} border-t-2 border-b-2 animate-spin`} />
            <div className={`absolute inset-1 rounded-full ${themeClasses[theme].border} border-r-2 border-l-2 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
          </div>
        );
    }
  };

  return (
    <motion.div 
      className={containerClasses}
      variants={containerAnimation}
      initial="hidden"
      animate="visible"
    >
      {renderSpinner()}
      
      {message && (
        <p className={`mt-4 font-medium ${sizeClasses[size].text} ${themeClasses[theme].text}`}>
          {message}
        </p>
      )}
    </motion.div>
  );
};

export default LoadingSpinner;