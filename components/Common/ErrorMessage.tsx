import React from 'react';
import { motion } from 'framer-motion';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <motion.div 
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p>{message}</p>
      {onRetry && (
        <button 
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;