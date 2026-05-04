import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AddBalanceForm from "./AddBalanceForm";
import { AddBalanceModalProps } from "@/types/teller";

const AddBalanceModal: React.FC<AddBalanceModalProps> = ({
  isOpen,
  onClose,
  user,
  amount,
  setAmount,
  handleAddBalance,
  addPointsResult,
  isCarnetAnimal,
  setIsCarnetAnimal,
  sacos,
  setSacos,
  onCarnetCompletado,
  autoFocusAmount = false,
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleAddBalance(e);
    } finally {
      setLoading(false);
    }
  };
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { 
        type: "tween" as const,
        ease: "easeInOut" as const,
        duration: 0.3 
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && user && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          key="add-balance-modal"
        >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-md relative z-10 flex flex-col max-h-[90vh]"
          variants={modalVariants}
        >
          <div className="bg-gradient-to-r from-green-700 to-green-800 p-6 rounded-t-lg text-white sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold flex items-center">
                <i className="fas fa-coins mr-2"></i>
                Añadir saldo
              </h3>
              <motion.button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <i className="fas fa-times"></i>
              </motion.button>
            </div>
            <div className="mt-2">
              <p className="text-white/90 text-sm">
                Usuario: <span className="font-medium">{user.firstName} {user.lastName}</span>
              </p>
              <div className="text-white/80 text-sm flex items-center mt-1">
                <i className="fas fa-star mr-1 text-yellow-300"></i>
                <span>Puntos actuales: {user.points || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-grow">
            <AddBalanceForm
              user={user}
              amount={amount}
              setAmount={setAmount}
              handleAddBalance={handleAddBalance}
              addPointsResult={addPointsResult}
              isCarnetAnimal={isCarnetAnimal}
              setIsCarnetAnimal={setIsCarnetAnimal}
              sacos={sacos}
              setSacos={setSacos}
              onSubmit={handleSubmit}
              loading={loading}
              onCarnetCompletado={onCarnetCompletado}
              autoFocus={autoFocusAmount}
            />
          </div>
          
          <div className="flex justify-end gap-3 p-6 pt-3 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddBalanceModal;
