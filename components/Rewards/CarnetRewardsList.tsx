'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { RewardCarnetMascota } from '@/types/teller';

interface CarnetRewardsListProps {
  recompensas: RewardCarnetMascota[];
  onCanjearClick?: (recompensa: RewardCarnetMascota) => void;
}

const CarnetRewardsList: React.FC<CarnetRewardsListProps> = ({
  recompensas,
  onCanjearClick,
}) => {
  // Verificar que recompensas existe y es un array antes de filtrar
  const recompensasActivas = (recompensas || []).filter(r => !r.usada && !r.canjeada);

  if (recompensasActivas.length === 0) {
    return null;
  }

  // Verificar si una recompensa ha expirado
  const isExpirada = (fechaExpiracion: string | null) => {
    if (!fechaExpiracion) return false;
    return new Date(fechaExpiracion) < new Date();
  };

  // Formatear fecha de expiración
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-8">
      {/* Título de la sección */}
      <div className="flex items-center mb-4">
        <div className="bg-green-100 p-3 rounded-full mr-3">
          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-800">
            Recompensas de Carnet de Mascota
          </h2>
          <p className="text-sm text-gray-600">
            ¡Sacos de pienso gratis por completar tus carnets!
          </p>
        </div>
      </div>

      {/* Lista de recompensas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recompensasActivas.map((recompensa, index) => {
          const expirada = isExpirada(recompensa.fechaExpiracion);
          
          return (
            <motion.div
              key={recompensa.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-xl shadow-md overflow-hidden border-2 ${
                expirada 
                  ? 'border-red-300 opacity-75' 
                  : 'border-green-200 hover:border-green-400 hover:shadow-lg'
              } transition-all duration-300`}
            >
              {/* Badge de expiración */}
              {expirada && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                  <i className="fas fa-clock mr-1"></i>
                  EXPIRADA
                </div>
              )}

              {/* Header con icono de pienso */}
              <div className={`relative ${expirada ? 'bg-gray-400' : 'bg-gradient-to-r from-green-600 to-green-700'} p-4`}>
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <i className={`fas fa-box-open text-3xl ${expirada ? 'text-gray-400' : 'text-green-600'}`}></i>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                {/* Nombre del producto */}
                <h3 className={`text-lg font-bold text-center mb-2 ${expirada ? 'text-gray-500' : 'text-green-800'}`}>
                  {recompensa.productNombre}
                </h3>

                {/* Información de la mascota */}
                <div className="flex items-center justify-center text-gray-600 mb-3">
                  <i className="fas fa-paw mr-2 text-green-600"></i>
                  <span className="text-sm">
                    {recompensa.petName}
                    {recompensa.petType && ` (${recompensa.petType})`}
                  </span>
                </div>

                {/* Detalles */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {recompensa.productPvp && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor:</span>
                      <span className="font-semibold">
                        {typeof recompensa.productPvp === 'number' 
                          ? recompensa.productPvp.toFixed(2) 
                          : parseFloat(recompensa.productPvp).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  {recompensa.fechaExpiracion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Canjea antes de:</span>
                      <span className={`font-semibold ${expirada ? 'text-red-500' : 'text-green-600'}`}>
                        {formatearFecha(recompensa.fechaExpiracion)}
                      </span>
                    </div>
                  )}
                  {recompensa.productBarcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ref:</span>
                      <span className="font-mono text-xs">{recompensa.productBarcode}</span>
                    </div>
                  )}
                </div>

                {/* Botón de canje */}
                <button
                  onClick={() => onCanjearClick && onCanjearClick(recompensa)}
                  disabled={expirada}
                  className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 ${
                    expirada
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:transform active:scale-95'
                  }`}
                >
                  <i className={`${expirada ? 'fas fa-times-circle mr-2' : 'fas fa-gift mr-2'}`}></i>
                  {expirada ? 'Expirada' : 'Canjear en tienda'}
                </button>
              </div>

              {/* Footer decorativo */}
              {!expirada && (
                <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CarnetRewardsList;