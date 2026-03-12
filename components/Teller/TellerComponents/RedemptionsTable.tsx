import React from "react";
import { motion } from "framer-motion";
import { RedemptionsTableProps } from "@/types/teller";

const RedemptionsTable: React.FC<RedemptionsTableProps> = ({
  redemptions,
  handleChangeRedemptionStatus,
  redemptionMsg
}) => {
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

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold text-green-700 flex items-center">
          <i className="fas fa-gift mr-2"></i>
          Recompensas canjeadas
        </h3>
      </div>
      
      {redemptionMsg && (
        <motion.div 
          className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <i className="fas fa-info-circle mr-2"></i>
          {redemptionMsg}
        </motion.div>
      )}
      
      {redemptions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                  Recompensa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                  Expiración
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-green-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {redemptions.map((redemption, idx) => (
                <motion.tr 
                  key={redemption.id} 
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{redemption.rewardName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {redemption.redemptionDate ? new Date(redemption.redemptionDate).toLocaleString() : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(redemption.status)}`}>
                      <i className={`fas ${getStatusIcon(redemption.status)} mr-1`}></i>
                      {redemption.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {redemption.status === "pendiente" && (
                      <motion.button
                        onClick={() => handleChangeRedemptionStatus(redemption.id, "entregado")}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-check-circle mr-1"></i>
                        Marcar como entregado
                      </motion.button>
                    )}
                    {redemption.status === "expirado" && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-red-600">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Recompensa expirada
                        </span>
                        <motion.button
                          onClick={() => handleChangeRedemptionStatus(redemption.id, "cancelado")}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-times-circle mr-1"></i>
                          Cancelar/Devolver
                        </motion.button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 bg-gray-50 p-6 rounded-lg text-center">
          <i className="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
          <p>No hay recompensas canjeadas.</p>
        </div>
      )}
    </div>
  );
};

export default RedemptionsTable;
