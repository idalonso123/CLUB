import React from 'react';
import { motion } from 'framer-motion';

interface PointsControlProps {
  value: number;
  onChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const PointsControl: React.FC<PointsControlProps> = ({
  value,
  onChange,
  onIncrement,
  onDecrement
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value) || 0);
  };

  return (
    <div className="flex items-center shadow-sm">
      <motion.button
        type="button"
        onClick={onDecrement}
        className="px-3 py-2 bg-gray-100 rounded-l hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
        whileHover={{ backgroundColor: "#e5e7eb" }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fas fa-minus text-gray-600"></i>
      </motion.button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        className="w-full py-2 px-3 border-y border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        autoComplete="off"
      />
      <motion.button
        type="button"
        onClick={onIncrement}
        className="px-3 py-2 bg-gray-100 rounded-r hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
        whileHover={{ backgroundColor: "#e5e7eb" }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fas fa-plus text-gray-600"></i>
      </motion.button>
    </div>
  );
};

export default PointsControl;