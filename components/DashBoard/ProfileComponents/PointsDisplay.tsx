import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import usePointsExpiration from '@/components/DashBoard/hooks/usePointsExpiration';
import useAppConfig from '@/components/hooks/useExpirationConfig';

interface PointsDisplayProps {
  points: number;
  itemVariants: any;
}

// Puntos necesarios para obtener un cheque de 5€ (valor fijo del sistema de recompensas)
const POINTS_FOR_VOUCHER = 50;
const VOUCHER_VALUE = 5;

const PointsDisplay: React.FC<PointsDisplayProps> = ({ points, itemVariants }) => {
  const [showExpirationDetails, setShowExpirationDetails] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isLoading, error, expirationData, formatMonthYear, formatDate } = usePointsExpiration();
  
  // Obtener configuración de puntos dinámicamente
  const { config: appConfig } = useAppConfig();
  
  // Valores dinámicos de configuración
  const eurosPorPunto = appConfig?.eurosPorPunto || 3.5;
  
  // Evitar problemas de hidratación usando useEffect
  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleExpirationDetails = () => {
    setShowExpirationDetails(prev => !prev);
  };

  // Asegurar que los puntos sean siempre un número válido
  const safePoints = typeof points === 'number' ? points : parseInt(String(points)) || 0;

  // Calcular puntos para el cheque de 5€
  const pointsForVoucher = POINTS_FOR_VOUCHER;
  const pointsToVoucher = Math.max(0, pointsForVoucher - safePoints);
  const progressToVoucher = Math.min((safePoints / pointsForVoucher) * 100, 100);
  const hasVoucherAvailable = safePoints >= pointsForVoucher;
  
  return (
    <>
      <motion.div
        className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Puntos de Fidelidad</h3>
        
        {/* Puntos acumulados con progreso hacia cheque de 5€ */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Puntos acumulados:</span>
            <span className="text-xl font-bold text-green-700">{safePoints}</span>
          </div>

          {/* Barra de progreso hacia el cheque de {VOUCHER_VALUE}€ */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progreso para cheque de {VOUCHER_VALUE}€</span>
              <span>{Math.round(progressToVoucher)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div 
                className={`h-2.5 rounded-full ${hasVoucherAvailable ? 'bg-green-600' : 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressToVoucher}%` }}
                transition={{ duration: 1, ease: "easeOut" as const }}
              />
            </div>
          </div>

          {/* Mensaje de estado */}
          {hasVoucherAvailable ? (
            <div className="flex items-center justify-between mt-2 p-2 bg-green-100 rounded border border-green-200">
              <div className="flex items-center">
                <i className="fas fa-gift text-green-600 mr-2"></i>
                <span className="text-sm font-medium text-green-700">
                  ¡Cheque de {VOUCHER_VALUE}€ disponible!
                </span>
              </div>
              <span className="text-xs text-green-600">
                Canjea en Recompensas
              </span>
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              {pointsToVoucher} puntos más para obtener un cheque de {VOUCHER_VALUE}€
            </div>
          )}
        </div>

        {/* Información sobre el sistema de puntos */}
        <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-start">
            <i className="fas fa-coins text-blue-600 mr-2 mt-1"></i>
            <div className="text-sm text-blue-700">
              <span className="font-medium">Sistema de puntos:</span>
              <p>Por cada {eurosPorPunto.toFixed(2).replace('.', ',')}€ de compra, acumulas <strong>1 punto</strong> de fidelidad.</p>
              <p className="mt-1">Con <strong>{POINTS_FOR_VOUCHER} puntos</strong> obtienes un cheque de <strong>{VOUCHER_VALUE}€</strong> de descuento.</p>
            </div>
          </div>
        </div>
        
        {/* Información de caducidad de puntos - Solo renderizar en el cliente */}
        {isClient && (
          isLoading ? (
            <div className="mt-3 p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-center">
                <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-100 text-red-700 text-sm">
              Error al cargar información de caducidad
            </div>
          ) : expirationData ? (
          <div className="mt-3">
            <div 
              onClick={toggleExpirationDetails}
              className="p-2 bg-green-50 rounded-md border border-green-100 text-green-700 text-sm cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Información de caducidad de puntos</span>
                </div>
                <svg className={`w-4 h-4 transition-transform ${showExpirationDetails ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <motion.div 
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ 
                height: showExpirationDetails ? 'auto' : 0, 
                opacity: showExpirationDetails ? 1 : 0,
                scale: showExpirationDetails ? 1 : 0.95
              }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut" as const,
                opacity: { duration: 0.25 },
                scale: { duration: 0.3 }
              }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-white rounded-md border border-gray-200 text-sm">
                {/* Mostrar resumen de puntos activos y caducados solo si hay datos */}
                {expirationData.resumenPorMes && expirationData.resumenPorMes.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600">Puntos activos</div>
                      <div className="text-xl font-bold text-green-700">{expirationData.puntosActivos}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600">Puntos caducados</div>
                      <div className="text-xl font-bold text-red-600">{expirationData.puntosCaducados}</div>
                    </div>
                  </div>
                )}
                
                {expirationData.resumenPorMes && expirationData.resumenPorMes.length > 0 ? (
                  <>
                    <div className="font-medium mb-1 text-green-700">Próximas caducidades:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {expirationData.resumenPorMes.map((item, index) => (
                        <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                          <span>{formatMonthYear(item.mesAno)}</span>
                          <span className="font-medium">{item.puntos} puntos</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="font-medium mb-1 text-green-700">Detalle de puntos:</div>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="py-1 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                              <th className="py-1 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caducidad</th>
                              <th className="py-1 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                              <th className="py-1 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {expirationData.detalle
                              .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
                              .map((item, index) => (
                                <tr key={item.id} className={item.caducado === 1 ? 'bg-red-50' : ''}>
                                  <td className="py-1 px-2">{item.puntos}</td>
                                  <td className="py-1 px-2">{formatDate(item.fecha_caducidad)}</td>
                                  <td className="py-1 px-2">
                                    {item.caducado === 1 ? (
                                      <span className="text-red-600 font-medium">Caducado</span>
                                    ) : (
                                      <span className="text-green-600 font-medium">Activo</span>
                                    )}
                                  </td>
                                  <td className="py-1 px-2">
                                    {item.caducado === 0 ? (
                                      <span className={item.diasRestantes < 30 ? 'text-orange-600 font-medium' : ''}>
                                        {item.diasRestantes}
                                      </span>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <i className="fas fa-calendar-times text-3xl mb-2"></i>
                    <p>No tienes registros de caducidad de puntos.</p>  
                    <p className="text-sm mt-1">Los puntos se registran con su fecha de caducidad cuando se añadan a tu cuenta.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          ) : (
            <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200 text-gray-500 text-center">
              <i className="fas fa-calendar-times text-3xl mb-2"></i>
              <p>No tienes registros de caducidad de puntos.</p>
              <p className="text-sm mt-1">Los puntos se registran con su fecha de caducidad cuando se añadan a tu cuenta.</p>
            </div>
          )
        )}
        
      </motion.div>
    </>
  );
};

export default PointsDisplay;