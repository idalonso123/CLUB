import React from 'react';
import { motion } from 'framer-motion';

interface ActionButtonsProps {
  onSave: (e: React.FormEvent) => void;  // Este debe ser el tipo correcto
  onCancel: () => void;
  saveText?: string;
  cancelText?: string;
  saveIcon?: string;
  cancelIcon?: string;
  disabled?: boolean;
  saveButtonType?: 'button' | 'submit';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSave,
  onCancel,
  saveText = 'Guardar',
  cancelText = 'Cancelar',
  saveIcon = 'fas fa-save',
  cancelIcon = 'fas fa-times',
  disabled = false,
  saveButtonType = 'submit'
}) => {
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
      <motion.button
        type={saveButtonType}
        className={`px-5 py-2 bg-green-800 text-white rounded ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-900 transition-colors'
        }`}
        variants={buttonVariants}
        whileHover={disabled ? undefined : "hover"}
        whileTap={disabled ? undefined : "tap"}
        onClick={saveButtonType === 'button' ? onSave : undefined}  // Solo llamamos al handler si es de tipo button
        disabled={disabled}
      >
        <span className="flex items-center justify-center">
          <i className={`${saveIcon} mr-2`}></i>
          {saveText}
        </span>
      </motion.button>
      
      <motion.button
        type="button"
        onClick={onCancel}
        className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <span className="flex items-center justify-center">
          <i className={`${cancelIcon} mr-2`}></i>
          {cancelText}
        </span>
      </motion.button>
    </div>
  );
};

export default ActionButtons;