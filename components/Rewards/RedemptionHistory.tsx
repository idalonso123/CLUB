import React from 'react';
import { motion } from 'framer-motion';
import { Redemption } from '@/types/rewards';

interface RedemptionHistoryProps {
  redemptions: Redemption[];
}

const RedemptionHistory: React.FC<RedemptionHistoryProps> = ({ redemptions }) => {
  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  // Funciones para determinar colores y íconos según el estado
  const getStatusColor = (status: string, isExpired?: boolean) => {
    if (isExpired) return 'text-red-600';
    
    switch(status.toLowerCase()) {
      case 'pendiente': return 'text-yellow-600';
      case 'completado': return 'text-green-600';
      case 'enviado': return 'text-blue-600';
      case 'cancelado': return 'text-red-600';
      case 'expirado': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string, isExpired?: boolean) => {
    if (isExpired) return 'fas fa-calendar-times';
    
    switch(status.toLowerCase()) {
      case 'pendiente': return 'fas fa-clock';
      case 'completado': return 'fas fa-check-circle';
      case 'enviado': return 'fas fa-shipping-fast';
      case 'cancelado': return 'fas fa-times-circle';
      case 'expirado': return 'fas fa-calendar-times';
      default: return 'fas fa-question-circle';
    }
  };
  
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
  
  // Función para calcular tiempo restante hasta expiración
  const getTimeUntilExpiration = (expirationDate: string) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    
    // Si es negativo, ya expiró
    if (diffTime < 0) return { days: 0, hours: 0 };
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingTime = diffTime - (diffDays * 1000 * 60 * 60 * 24);
    const diffHours = Math.ceil(remainingTime / (1000 * 60 * 60));
    
    return { days: diffDays, hours: diffHours };
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="mb-8"
    >
      <motion.h2 
        variants={itemVariants}
        className="text-2xl font-bold text-green-800 mb-4"
      >
        Historial de Canjes
      </motion.h2>

      {redemptions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recompensa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiración
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redemptions.map((redemption) => (
                  <tr key={redemption.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {redemption.imageUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={redemption.imageUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <i className="fas fa-gift text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {redemption.rewardName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {redemption.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{redemption.pointsSpent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(redemption.status, redemption.isExpired)}`}>
                        <i className={`${getStatusIcon(redemption.status, redemption.isExpired)} mr-1`}></i>
                        {redemption.isExpired ? 'Expirado' : redemption.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(redemption.redemptionDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {redemption.hasExpiration && redemption.expirationDate ? (
                        <div>
                          {redemption.isExpired ? (
                            <span className="text-red-600">
                              <i className="fas fa-calendar-times mr-1"></i>
                              Expirado el {formatExpirationDate(redemption.expirationDate)}
                            </span>
                          ) : redemption.status === 'pendiente' ? (
                            <span className={
                              getTimeUntilExpiration(redemption.expirationDate) && 
                              (getTimeUntilExpiration(redemption.expirationDate)!.days === 0 || 
                               getTimeUntilExpiration(redemption.expirationDate)!.days < 2) ? 'text-red-600' : 
                              getTimeUntilExpiration(redemption.expirationDate)!.days < 7 ? 'text-orange-600' : 'text-gray-600'
                            }>
                              <i className="fas fa-hourglass-half mr-1"></i>
                              {(() => {
                                const timeLeft = getTimeUntilExpiration(redemption.expirationDate);
                                if (!timeLeft) return '';
                                
                                if (timeLeft.days === 0 && timeLeft.hours === 0) {
                                  return 'Expira en unos minutos';
                                } else if (timeLeft.days === 0) {
                                  return `Expira en ${timeLeft.hours} ${timeLeft.hours === 1 ? 'hora' : 'horas'}`;
                                } else if (timeLeft.days === 1) {
                                  return 'Expira mañana';
                                } else {
                                  return `Expira en ${timeLeft.days} días`;
                                }
                              })()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Sin expiración</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-5xl text-gray-300 mb-4">
            <i className="fas fa-history"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No tienes canjes</h3>
          <p className="text-gray-600">Todavía no has canjeado ninguna recompensa</p>
        </div>
      )}
    </motion.div>
  );
};

export default RedemptionHistory;
