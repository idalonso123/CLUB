import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Barcode from "react-barcode";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  redemptionId: number;
  rewardName: string;
  barcode?: string;
  visibleCode?: string;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  redemptionId,
  rewardName,
  barcode,
  visibleCode
}) => {
  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Función para renderizar el código de barras con react-barcode
  const renderBarcode = () => {
    if (!barcode) {
      return (
        <div className="bg-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay código de barras disponible</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 border border-gray-300 rounded-md">
          <div className="flex flex-col items-center">
            {/* Usar el componente Barcode para generar el código de barras */}
            <Barcode 
              value={barcode} 
              width={1.5}
              height={60}
              fontSize={14}
              margin={10}
              displayValue={false} // No mostrar el valor debajo del código de barras (usaremos nuestro propio texto)
            />
            
            {/* Código visible debajo del código de barras */}
            <p className="mt-2 font-mono text-sm">{visibleCode || barcode}</p>
            
            {/* Nombre de la recompensa debajo del código */}
            <p className="mt-2 text-sm font-medium text-gray-700 text-center">{rewardName}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            {/* Overlay con backdrop blur */}
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
              style={{ zIndex: 40 }}
            />
            
            {/* Modal content */}
            <motion.div
              className="inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl relative"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              style={{ zIndex: 50 }}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <i className="fas fa-barcode mr-2"></i>
                    Código de Barras
                  </h3>
                  <div className="mt-1 text-sm text-green-100">
                    {rewardName}
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-white/80 hover:text-white rounded-full p-2 transition hover:bg-white/10"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Cuerpo del modal */}
              <div className="p-6">
                <div className="mb-4 text-center">
                  <p className="text-gray-600 mb-4">
                    Escanea este código de barras para validar la recompensa en Sage.
                  </p>
                  
                  {renderBarcode()}
                  
                </div>
              </div>
              
              {/* Footer del modal */}
              <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={onClose}
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BarcodeModal;
