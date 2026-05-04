import React from "react";

type BadgeVariant = 
  | "primary" 
  | "secondary" 
  | "success" 
  | "warning" 
  | "danger" 
  | "info" 
  | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "primary",
  className = ""
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-100 text-blue-800";
      case "secondary":
        return "bg-gray-100 text-gray-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "danger":
        return "bg-red-100 text-red-800";
      case "info":
        return "bg-indigo-100 text-indigo-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantClasses()} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;