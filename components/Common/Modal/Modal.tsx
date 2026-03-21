import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
  showCloseButton = true
}) => {
  // Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          className="absolute inset-0 backdrop-blur-sm backdrop-filter"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        ></motion.div>
        
        <motion.div
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-lg ${maxWidth} w-full relative z-10 max-h-[90vh] overflow-y-auto`}
          onClick={handleContentClick}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-green-800">
                {title}
              </h3>
              
              {showCloseButton && (
                <motion.button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full p-1"
                  type="button"
                  aria-label="Cerrar"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <i className="fas fa-times"></i>
                </motion.button>
              )}
            </div>
          )}
          
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;