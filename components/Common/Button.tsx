import React from "react";
import { motion } from "framer-motion";

type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "success" 
  | "warning" 
  | "danger" 
  | "info";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  icon?: string;
  highlight?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  icon,
  highlight = false,
}) => {
  // Variantes de animación para el botón (sin efecto de escala para reducir el efecto de sombra)
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  };

  // Variantes para la animación del borde brillante
  const borderVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: [0.4, 0.8, 0.4],
      transition: { 
        repeat: Infinity, 
        duration: 2, 
        ease: "easeInOut" as const
      }
    }
  };

  const getVariantClasses = () => {
    const baseClasses = {
      primary: "bg-blue-700 hover:bg-blue-800 text-white",
      secondary: "bg-gray-500 hover:bg-gray-600 text-white",
      success: "bg-green-700 hover:bg-green-800 text-white",
      warning: "bg-yellow-700 hover:bg-yellow-800 text-white",
      danger: "bg-red-700 hover:bg-red-800 text-white",
      info: "bg-indigo-700 hover:bg-indigo-800 text-white",
    };
    
    // No añadimos ring/border aquí, lo haremos con un elemento absoluto
    return baseClasses[variant] || baseClasses.primary;
  };
  
  // Colores para el borde brillante
  const getBorderColor = () => {
    const colors = {
      primary: "rgb(96, 165, 250)",
      secondary: "rgb(156, 163, 175)",
      success: "rgb(52, 211, 153)",
      warning: "rgb(251, 191, 36)",
      danger: "rgb(248, 113, 113)",
      info: "rgb(139, 92, 246)",
    };
    
    return colors[variant] || colors.primary;
  };

  return (
    <motion.div 
      className="relative inline-block"
      variants={buttonVariants}
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
    >
      {/* Borde brillante animado que solo aparece cuando highlight=true */}
      {highlight && !disabled && (
        <motion.span
          className="absolute inset-0 rounded"
          style={{ 
            border: `1px solid ${getBorderColor()}`,
            zIndex: -1
          }}
          variants={borderVariants}
          initial="hidden"
          animate="visible"
        />
      )}
      
      {/* El botón en sí mismo */}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`relative px-4 py-2 rounded transition-colors flex items-center ${getVariantClasses()} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
      >
        {icon && <i className={`${icon} mr-2`}></i>}
        {children}
      </button>
    </motion.div>
  );
};

export default Button;