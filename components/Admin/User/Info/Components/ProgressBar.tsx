import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  label?: string;
  value?: string | number;
  height?: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "bg-green-800",
  label,
  value,
  height = 2,
  className = "",
}) => {
  // Asegurarse de que el progreso esté entre 0 y 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      {(label || value !== undefined) && (
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          {label && <span>{label}</span>}
          {value !== undefined && <span>{value}</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full h-${height}`}>
        <motion.div
          className={`${color} h-${height} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
        ></motion.div>
      </div>
    </div>
  );
};

export default ProgressBar;