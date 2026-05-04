'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTermsUsageUrl } from '@/lib/utils/pageUtils';
import { useClientLevels, ClientLevel } from '@/components/hooks/useExpirationConfig';

interface ClientLevelDisplayProps {
  points: number;
  itemVariants: any;
}

// Colores para cada nivel
const LEVEL_COLORS: Record<string, { bgColor: string; borderColor: string; textColor: string }> = {
  1: { bgColor: 'bg-amber-100', borderColor: 'border-amber-300', textColor: 'text-amber-800' },
  2: { bgColor: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-800' },
  3: { bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300', textColor: 'text-emerald-800' },
  4: { bgColor: 'bg-pink-100', borderColor: 'border-pink-300', textColor: 'text-pink-800' },
};

// Beneficios base por nivel (sin los puntos dinámicos)
const BASE_BENEFITS: Record<number, string[]> = {
  1: ['Descuentos especiales para miembros del club'],
  2: ['Todo lo anterior', 'Acceso al catálogo de recompensas'],
  3: ['Todo lo anterior', 'Descuentos exclusivos adicionales', 'Acceso a recompensas premium'],
  4: ['Todo lo anterior', 'Asesoramiento personalizado sobre productos', 'Acceso prioritario a eventos'],
};

// Puntos y valor del cheque (valores fijos del sistema de recompensas)
const POINTS_FOR_VOUCHER = 50;
const VOUCHER_VALUE = 5;

const ClientLevelDisplay: React.FC<ClientLevelDisplayProps> = ({ points, itemVariants }) => {
  const { clientLevels, loading, error } = useClientLevels();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generar texto de compra mínima
  const getPurchaseText = (level: ClientLevel): string => {
    if (level.eurosCompraMinima === 0) {
      return 'Sin compra mínima semestral';
    }
    return `Compra mínima semestral de ${level.eurosCompraMinima}€`;
  };

  // Generar beneficios dinámicos para cada nivel
  const getLevelBenefits = (level: ClientLevel): string[] => {
    const benefits = BASE_BENEFITS[level.nivel] || [];
    
    // Añadir el beneficio del cheque solo para el nivel 2 (Brote) - primer nivel con recompensas
    if (level.nivel === 2) {
      return [
        ...benefits,
        `Cheque ${VOUCHER_VALUE}€ al alcanzar ${POINTS_FOR_VOUCHER} puntos`
      ];
    }
    return benefits;
  };

  // Determinar el nivel actual basado en los puntos
  const getCurrentLevel = (userPoints: number): ClientLevel | null => {
    if (!clientLevels || clientLevels.length === 0) return null;
    
    // Ordenar niveles por número
    const sortedLevels = [...clientLevels].sort((a, b) => a.nivel - b.nivel);
    
    // Encontrar el nivel correspondiente
    for (let i = sortedLevels.length - 1; i >= 0; i--) {
      if (userPoints >= sortedLevels[i].puntosMinimos) {
        return sortedLevels[i];
      }
    }
    return sortedLevels[0];
  };

  // Obtener el siguiente nivel
  const getNextLevel = (currentLevel: ClientLevel): ClientLevel | null => {
    if (!clientLevels || clientLevels.length === 0) return null;
    
    const sortedLevels = [...clientLevels].sort((a, b) => a.nivel - b.nivel);
    const currentIndex = sortedLevels.findIndex(l => l.nivel === currentLevel.nivel);
    
    return currentIndex < sortedLevels.length - 1 ? sortedLevels[currentIndex + 1] : null;
  };

  // Calcular progreso hacia el siguiente nivel
  const getProgressToNextLevel = (currentLevel: ClientLevel, userPoints: number): number => {
    if (currentLevel.puntosMaximos === null) {
      return 100; // Ya está en el nivel máximo
    }
    const pointsInCurrentLevel = userPoints - currentLevel.puntosMinimos;
    const pointsNeededForLevel = currentLevel.puntosMaximos - currentLevel.puntosMinimos + 1;
    return Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);
  };

  // Calcular puntos faltantes para el siguiente nivel
  const getPointsToNextLevel = (currentLevel: ClientLevel, userPoints: number): number => {
    if (currentLevel.puntosMaximos === null) {
      return 0; // Ya está en el nivel máximo
    }
    return currentLevel.puntosMaximos + 1 - userPoints;
  };

  // Obtener colores del nivel
  const getLevelColors = (level: ClientLevel) => {
    return LEVEL_COLORS[level.nivel] || LEVEL_COLORS[1];
  };

  if (loading) {
    return (
      <motion.div
        className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Nivel de Cliente</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          <span className="ml-3 text-gray-500">Cargando niveles...</span>
        </div>
      </motion.div>
    );
  }

  if (error || !clientLevels || clientLevels.length === 0) {
    return (
      <motion.div
        className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Nivel de Cliente</h3>
        <p className="text-gray-500 text-center py-4">No se pudieron cargar los niveles</p>
      </motion.div>
    );
  }

  const currentLevel = getCurrentLevel(points);
  if (!currentLevel) return null;

  const nextLevel = getNextLevel(currentLevel);
  const progress = getProgressToNextLevel(currentLevel, points);
  const pointsToNext = getPointsToNextLevel(currentLevel, points);
  const colors = getLevelColors(currentLevel);
  const benefits = getLevelBenefits(currentLevel);
  const purchaseText = getPurchaseText(currentLevel);

  return (
    <>
      <motion.div
        className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Nivel de Cliente</h3>
        
        {/* Nivel actual */}
        <div className={`p-4 ${colors.bgColor} rounded-lg border ${colors.borderColor} mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{currentLevel.icono}</span>
              <div>
                <div className={`font-bold text-lg ${colors.textColor}`}>
                  Nivel {currentLevel.nombre}
                </div>
                <div className="text-sm text-gray-600">
                  {currentLevel.puntosMinimos} - {currentLevel.puntosMaximos === null ? '∞' : currentLevel.puntosMaximos} puntos
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">{points}</div>
              <div className="text-xs text-gray-500">puntos</div>
            </div>
          </div>

          {/* Barra de progreso */}
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso hacia {nextLevel.nombre}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className={`h-2.5 rounded-full ${colors.bgColor.replace('100', '500')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" as const }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pointsToNext > 0 
                  ? `${pointsToNext} puntos para alcanzar ${nextLevel.nombre}`
                  : `¡Has alcanzado ${nextLevel.nombre}!`
                }
              </div>
            </div>
          )}

          {!nextLevel && (
            <div className="mt-3 text-center">
              <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                ¡Nivel máximo alcanzado!
              </span>
            </div>
          )}
        </div>

        {/* Requisito de compra mínima */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-shopping-cart text-gray-500 mr-2"></i>
            <span className="font-medium text-gray-700">Mantenimiento de nivel</span>
          </div>
          <p className="text-sm text-gray-600">
            {purchaseText}
          </p>
        </div>

        {/* Beneficios del nivel actual */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-star text-yellow-500 mr-2"></i>
            <span className="font-medium text-gray-700">Beneficios de tu nivel</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tabla de niveles */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center mb-3">
            <i className="fas fa-layer-group text-green-600 mr-2"></i>
            <span className="font-medium text-gray-700">Todos los niveles</span>
          </div>
          <div className="space-y-2">
            {clientLevels.sort((a, b) => a.nivel - b.nivel).map((level) => {
              const isActive = level.nivel === currentLevel.nivel;
              const isPast = points > (level.puntosMaximos || level.puntosMinimos);
              const levelColors = getLevelColors(level);
              return (
                <div 
                  key={level.nivel}
                  className={`flex items-center justify-between p-2 rounded ${
                    isActive ? levelColors.bgColor : isPast ? 'bg-gray-100 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{level.icono}</span>
                    <div>
                      <div className={`font-medium ${isActive ? levelColors.textColor : 'text-gray-700'}`}>
                        {level.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.puntosMinimos} - {level.puntosMaximos === null ? '∞' : level.puntosMaximos} pts
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <span className={`text-xs px-2 py-1 rounded-full ${levelColors.bgColor} ${levelColors.textColor} font-medium`}>
                      Actual
                    </span>
                  )}
                  {isPast && (
                    <i className="fas fa-check-circle text-green-500"></i>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enlace a términos y condiciones */}
        <div className="mt-4 text-center">
          <a
            href={getTermsUsageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:text-green-900 hover:underline"
          >
            <i className="fas fa-external-link-alt mr-1"></i>
            Conoce todos los beneficios exclusivos de cada nivel
          </a>
        </div>
      </motion.div>
    </>
  );
};

export default ClientLevelDisplay;