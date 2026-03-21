import React from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Common/Modal/Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: React.ReactNode;
  warningText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonClass = "bg-green-700 hover:bg-green-800",
  icon,
  warningText,
}) => {
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {/* Icono y título */}
      <div className="text-center mb-6">
        {icon && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-opacity-10 mb-4">
            {icon}
          </div>
        )}
        <h3
          id="confirmation-modal-title"
          className="text-xl font-semibold text-gray-900"
        >
          {title}
        </h3>
      </div>

      {/* Contenido del modal */}
      <div className="mb-6 text-center">
        <p className="text-gray-600">{message}</p>
        
        {warningText && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm text-left">
            <div className="flex">
              <i className="fas fa-exclamation-triangle mt-0.5 mr-2"></i>
              <div dangerouslySetInnerHTML={{ __html: warningText }} />
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center space-x-3">
        <motion.button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          type="button"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {cancelText}
        </motion.button>
        <motion.button
          onClick={onConfirm}
          className={`px-4 py-2 ${confirmButtonClass} text-white rounded transition-colors`}
          type="button"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {confirmText}
        </motion.button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;