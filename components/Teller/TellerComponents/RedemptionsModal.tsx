import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Redemption, RedemptionsModalProps } from "@/types/teller";
import BarcodeModal from "./BarcodeModal";

interface RedemptionsModalExtendedProps extends RedemptionsModalProps {
  userRole?: string | null;
}

const RedemptionsModal: React.FC<RedemptionsModalExtendedProps> = ({
  isOpen,
  onClose,
  user,
  redemptions,
  handleChangeRedemptionStatus,
  redemptionMsg,
  userRole
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelRedemptionData, setCancelRedemptionData] = useState<{id: number, name: string, points?: number} | null>(null);
  const [cancelNotes, setCancelNotes] = useState<string>('');
  
  // Función para generar códigos alfanuméricos aleatorios de 8 caracteres
  const generarCodigoAleatorio = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  if (!isOpen || !user) return null;

  // Usar el rol recibido por props
  const isAdmin = userRole === "administrador" || userRole === "admin";
  
  // Función para formatear la fecha de expiración
  const formatExpirationDate = (expirationDate: string) => {
    if (!expirationDate) return '';
    
    const date = new Date(expirationDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "entregado":
        return "bg-green-100 text-green-800";
      case "completado":
        return "bg-blue-100 text-blue-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "expirado":
        return "bg-red-100 text-red-800";
      case "cancelado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "entregado":
        return "fa-check-circle";
      case "completado":
        return "fa-check-square";
      case "pendiente":
        return "fa-clock";
      case "expirado":
        return "fa-calendar-times";
      case "cancelado":
        return "fa-times-circle";
      default:
        return "fa-circle";
    }
  };

  const handleRevertRedemption = async (redemptionId: number) => {
    try {
      const response = await fetch("/api/cajero/redemption-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status: "pendiente" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al revertir la recompensa");
      }

      alert("Recompensa revertida con éxito");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as Error).message
        : "Error al revertir la recompensa";
      alert(errorMessage);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
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
            
            {/* Modal content - colocado en un z-index superior al del overlay */}
            <motion.div
              className="inline-block w-full max-w-6xl p-0 my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl relative max-h-[90vh]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              style={{ zIndex: 50 }}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 md:p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white flex items-center">
                    <i className="fas fa-gift mr-2"></i>
                    Recompensas de {user.firstName} {user.lastName}
                  </h3>
                  <div className="mt-1 flex items-center text-green-100">
                    <i className="fas fa-star mr-2 text-yellow-300"></i>
                    <span>{user.points || 0} puntos disponibles</span>
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
                {redemptionMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-md flex items-start"
                  >
                    <i className="fas fa-check-circle mt-0.5 mr-2 text-green-500"></i>
                    <span>{redemptionMsg}</span>
                  </motion.div>
                )}
                
                {redemptions.length > 0 ? (
                  <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200 w-full max-w-full">
                    <table className="w-full divide-y divide-gray-200 table-auto text-xs md:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recompensa
                          </th>
                          <th scope="col" className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de canje
                          </th>
                          <th scope="col" className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expiración
                          </th>
                          <th scope="col" className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th scope="col" className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {redemptions.map((redemption, idx) => (
                          <motion.tr 
                            key={redemption.id}
                            custom={idx}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            className="hover:bg-gray-50"
                          >
                            <td className="px-2 md:px-4 py-3 md:py-4 whitespace-normal md:whitespace-nowrap text-xs md:text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                  <i className="fas fa-gift"></i>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{redemption.rewardName}</div>
                                  {redemption.notes && (
                                    <div className="text-sm text-gray-500">{redemption.notes}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 md:px-4 py-3 md:py-4 whitespace-normal md:whitespace-nowrap text-xs md:text-sm">
                              <div className="text-sm text-gray-500">
                                {redemption.redemptionDate 
                                  ? new Date(redemption.redemptionDate).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) 
                                  : ""}
                              </div>
                            </td>
                            <td className="px-2 md:px-4 py-3 md:py-4 whitespace-normal md:whitespace-nowrap text-xs md:text-sm">
                              <div className="text-sm">
                                {redemption.hasExpiration && redemption.expirationDate ? (
                                  redemption.isExpired ? (
                                    <span className="text-red-600">
                                      <i className="fas fa-calendar-times mr-1"></i>
                                      Expiró el {formatExpirationDate(redemption.expirationDate)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600">
                                      <i className="fas fa-calendar-alt mr-1"></i>
                                      {formatExpirationDate(redemption.expirationDate)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-500">No expira</span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 md:px-4 py-3 md:py-4 whitespace-normal md:whitespace-nowrap text-xs md:text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(redemption.status)}`}>
                                <i className={`fas ${getStatusIcon(redemption.status)} mr-1`}></i>
                                {redemption.status}
                              </span>
                            </td>
                            <td className="px-2 md:px-4 py-3 md:py-4 whitespace-normal md:whitespace-nowrap text-right text-xs md:text-sm flex gap-2 justify-end md:flex-row flex-col">
                              {redemption.status !== "cancelado" && (
                                <>
                                  {/* Botón de entregar recompensa - solo para pendientes */}
                                  {redemption.status === "pendiente" && (
                                    <motion.button
                                      onClick={() => handleChangeRedemptionStatus(redemption.id, "entregado")}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                                    >
                                      <i className="fas fa-check-circle mr-1"></i>
                                      Marcar entregado
                                    </motion.button>
                                  )}

                                  {/* Botón de cancelar/devolver recompensa - permitido para expiradas */}
                                  {(redemption.status === "pendiente" || redemption.status === "expirado") && (
                                    <motion.button
                                      onClick={() => {
                                        // Abrir el modal de confirmación en lugar de window.confirm
                                        setCancelRedemptionData({
                                          id: redemption.id,
                                          name: redemption.rewardName,
                                          points: redemption.pointsSpent
                                        });
                                        setShowCancelConfirm(true);
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                                    >
                                      <i className="fas fa-times-circle mr-1"></i>
                                      Cancelar/Devolver
                                    </motion.button>
                                  )}

                                  {/* Botón adicional para administradores que permite revertir estados completados */}
                                  {isAdmin && redemption.status === "completado" && (
                                    <motion.button
                                      onClick={() => handleChangeRedemptionStatus(redemption.id, "pendiente")}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
                                    >
                                      <i className="fas fa-undo mr-1"></i>
                                      Revertir
                                    </motion.button>
                                  )}

                                  {/* Botón para mostrar código de barras */}
                                  <motion.button
                                    onClick={() => {
                                      setSelectedRedemption(redemption);
                                      setShowBarcodeModal(true);
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                                  >
                                    <i className="fas fa-barcode mr-1"></i>
                                    Código de Barras
                                  </motion.button>
                                </>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 px-4 text-center"
                  >
                    <div className="bg-gray-100 rounded-full p-6 mb-4">
                      <i className="fas fa-gift text-gray-400 text-4xl"></i>
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Sin recompensas canjeadas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Este usuario no ha canjeado ninguna recompensa todavía.
                    </p>
                  </motion.div>
                )}
              </div>
              
              {/* Footer del modal */}
              <div className="bg-gray-50 px-4 md:px-6 py-3 flex justify-end border-t border-gray-200">
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

      {/* Modal de confirmación de cancelación de recompensa */}
      {/* Modal de código de barras */}
      {isOpen && showBarcodeModal && selectedRedemption && (
        <BarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          redemptionId={selectedRedemption.id}
          rewardName={selectedRedemption.rewardName}
          barcode={selectedRedemption.codigoBarras || generarCodigoAleatorio()}
          visibleCode={selectedRedemption.codigoVisible || generarCodigoAleatorio()}
        />
      )}

      {isOpen && showCancelConfirm && cancelRedemptionData && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              {/* Overlay con backdrop blur */}
              <motion.div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelConfirm(false)}
              />
              
              {/* Modal content */}
              <motion.div
                className="inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl relative z-[101]"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {/* Header con icono de advertencia */}
                <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-700">Confirmar cancelación</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
                
                {/* Cuerpo del modal */}
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                      ¿Está seguro que desea cancelar la recompensa <strong>{cancelRedemptionData.name}</strong>?
                    </p>
                    
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <i className="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">Importante</h4>
                          <div className="mt-1 text-sm text-yellow-700">
                            <p>Al cancelar esta recompensa:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>Se devolverán {cancelRedemptionData.points || '?'} puntos al usuario</li>
                              <li>Se repondrá el stock de la recompensa (si no es ilimitado)</li>
                              <li>Se registrará esta acción en el historial</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Cancelar
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => {
                        handleChangeRedemptionStatus(
                          cancelRedemptionData.id,
                          "cancelado",
                          "Recompensa cancelada y puntos devueltos al usuario."
                        );
                        setShowCancelConfirm(false);
                      }}
                    >
                      Confirmar devolución
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
    </AnimatePresence>
  );
};

export default RedemptionsModal;
