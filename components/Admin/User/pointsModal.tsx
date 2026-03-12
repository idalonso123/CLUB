import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/types/user";
import { PointsData, AdjustmentType, TypeOption, PointPreset } from "@/types/points";

// Componentes comunes
import Modal from "@/components/Common/Modal/Modal";

// Componentes específicos
import PointsInfoPanel from "@/components/Admin/User/Points/PointsInfoPanel";
import PointsPresets from "@/components/Admin/User/Points/PointsPresets";
import PointsControl from "@/components/Admin/User/Points/PointsControl";
import PointsSlider from "@/components/Admin/User/Points/PointsSlider";
import TypeSelector from "@/components/Admin/User/Points/TypeSelector";

interface AdjustPointsModalProps {
  user: User | null;
  onSave: (user: User, pointsData: PointsData) => void;
  onClose: () => void;
}

// Opciones para el tipo de ajuste con iconos y colores
const TYPE_OPTIONS: TypeOption[] = [
  { value: 'Administrador', label: 'Ajuste Administrativo', icon: 'fas fa-user-shield', variant: 'info' },
  { value: 'Bonificación', label: 'Bonificación', icon: 'fas fa-gift', variant: 'purple' },
  { value: 'Compra', label: 'Compra', icon: 'fas fa-shopping-cart', variant: 'success' },
  { value: 'Canje', label: 'Canje de Recompensa', icon: 'fas fa-exchange-alt', variant: 'warning' },
  { value: 'Caducidad', label: 'Caducidad de Puntos', icon: 'fas fa-calendar-times', variant: 'danger' },
  { value: 'Sistema', label: 'Ajuste del Sistema', icon: 'fas fa-cogs', variant: 'secondary' }
];

// Presets de puntos para los botones rápidos
const POINT_PRESETS: PointPreset[] = [
  { value: -100, label: "-100", variant: "danger" },
  { value: -50, label: "-50", variant: "danger" },
  { value: -10, label: "-10", variant: "danger" },
  { value: 10, label: "+10", variant: "success" },
  { value: 50, label: "+50", variant: "success" },
  { value: 100, label: "+100", variant: "success" },
];

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  user,
  onSave,
  onClose,
}) => {
  const [pointsData, setPointsData] = useState<PointsData>({
    currentPoints: 0,
    adjustment: 0,
    reason: "",
    type: "Administrador"
  });

  // Inicializar datos cuando se recibe un usuario
  useEffect(() => {
    if (user) {
      setPointsData({
        currentPoints: user.points || 0,
        adjustment: 0,
        reason: "",
        type: "Administrador"
      });
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [user]);

  if (!user) return null;

  const newPointsTotal = pointsData.currentPoints + pointsData.adjustment;

  // Manejadores de eventos
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AdjustmentType;
    
    // Generar sugerencia de razón si es necesario
    const isDefaultReason = TYPE_OPTIONS.some(option => 
      suggestReason(option.value) === pointsData.reason || pointsData.reason === ""
    );
    
    setPointsData(prev => ({
      ...prev,
      type: newType,
      reason: isDefaultReason ? suggestReason(newType) : prev.reason
    }));
  };

  const handleAdjustmentChange = (value: number) => {
    setPointsData(prev => ({
      ...prev,
      adjustment: value
    }));
  };

  const handleIncrementAdjustment = () => {
    setPointsData(prev => ({
      ...prev,
      adjustment: prev.adjustment + 1
    }));
  };

  const handleDecrementAdjustment = () => {
    setPointsData(prev => ({
      ...prev,
      adjustment: prev.adjustment - 1
    }));
  };

  const handleSelectPreset = (value: number) => {
    setPointsData(prev => ({
      ...prev,
      adjustment: prev.adjustment + value
    }));
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPointsData(prev => ({
      ...prev,
      reason: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Asegurarse de que newPoints esté definido
    const dataToSave: PointsData = {
      ...pointsData,
      newPoints: pointsData.currentPoints + pointsData.adjustment
    };
    
    // Llamar a onSave con el usuario y los datos de puntos
    onSave(user, dataToSave);
  };

  // Sugiere automáticamente la razón basada en el tipo seleccionado
  const suggestReason = (type: string): string => {
    switch (type) {
      case 'Administrador': return "Ajuste administrativo de puntos";
      case 'Bonificación': return "Bonificación por fidelidad";
      case 'Compra': return "Puntos por compra";
      case 'Canje': return "Canje de recompensa";
      case 'Caducidad': return "Caducidad de puntos no utilizados";
      case 'Sistema': return "Ajuste automático del sistema";
      default: return "";
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Obtener el tipo seleccionado
  const selectedType = TYPE_OPTIONS.find(t => t.value === pointsData.type) || TYPE_OPTIONS[0];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
      >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm backdrop-filter"
          onClick={onClose}
        ></motion.div>
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-10"
          onClick={(e) => e.stopPropagation()}
          variants={modalVariants}
        >
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-green-700 to-green-800 -m-6 mb-4 p-6 rounded-t-lg text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold flex items-center">
                <i className="fas fa-star mr-2"></i>
                Reajustar Puntos
              </h3>
              <motion.button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-full"
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <i className="fas fa-times"></i>
              </motion.button>
            </div>
            <div className="mt-2">
              <p className="text-white/90 text-sm">Usuario: <span className="font-medium">{user.firstName} {user.lastName}</span></p>
              <p className="text-white/80 text-sm">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Panel de información de puntos */}
              <PointsInfoPanel
                currentPoints={pointsData.currentPoints}
                adjustment={pointsData.adjustment}
                newTotal={newPointsTotal}
              />
              
              {/* Selector de tipo */}
              <TypeSelector
                value={pointsData.type}
                onChange={handleTypeChange}
                options={TYPE_OPTIONS}
              />
              
              {/* Ajuste de puntos */}
              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="points-adjustment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Ajuste de Puntos
                  </label>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full inline-flex items-center">
                    <i className={`${selectedType.icon} mr-1`}></i>
                    {selectedType.label}
                  </span>
                </div>
                
                {/* Presets rápidos de ajuste */}
                <PointsPresets
                  presets={POINT_PRESETS}
                  onSelectPreset={handleSelectPreset}
                  currentAdjustment={pointsData.adjustment}
                />
                
                {/* Control de entrada ajuste personalizado */}
                <PointsControl
                  value={pointsData.adjustment}
                  onChange={handleAdjustmentChange}
                  onIncrement={handleIncrementAdjustment}
                  onDecrement={handleDecrementAdjustment}
                />
                
                {/* Control deslizante (slider) */}
                <PointsSlider
                  value={pointsData.adjustment}
                  min={-100}
                  max={100}
                  step={5}
                  onChange={handleAdjustmentChange}
                />
              </div>
              
              {/* Razón */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="points-reason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Razón del Ajuste
                  </label>
                </div>
                <textarea
                  id="points-reason"
                  name="reason"
                  value={pointsData.reason}
                  onChange={handleReasonChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  required
                  placeholder="Especifica la razón del ajuste de puntos..."
                  autoComplete="off"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6 border-t border-gray-400 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="fas fa-times mr-1"></i>
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                className={`px-4 py-2 bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  pointsData.reason.trim().length === 0 || pointsData.adjustment === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-green-800'
                }`}
                whileHover={pointsData.reason.trim().length > 0 && pointsData.adjustment !== 0 ? { scale: 1.02 } : {}}
                whileTap={pointsData.reason.trim().length > 0 && pointsData.adjustment !== 0 ? { scale: 0.98 } : {}}
                disabled={pointsData.reason.trim().length === 0 || pointsData.adjustment === 0}
              >
                <i className="fas fa-save mr-1"></i>
                Guardar Cambios
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdjustPointsModal;
