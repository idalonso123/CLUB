'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTermsUsageUrl } from '@/lib/utils/pageUtils';

interface ClientLevelDisplayProps {
  points: number;
  itemVariants: any;
}

// Definición de niveles según los Términos y Condiciones
// NOTA: Los niveles básicos se definen aquí, pero los beneficios dinámicos se generan en el componente
const BASE_LEVELS = [
  {
    name: 'Semilla',
    minPoints: 0,
    maxPoints: 49,
    color: 'brown',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-800',
    icon: '🌱',
    baseBenefits: ['Descuentos especiales para miembros del club'],
    minPurchase: 0,
    purchaseText: 'Sin compra mínima semestral'
  },
  {
    name: 'Brote',
    minPoints: 50,
    maxPoints: 89,
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    icon: '🌿',
    baseBenefits: [
      'Todo lo anterior',
      'Acceso al catálogo de recompensas'
    ],
    minPurchase: 150,
    purchaseText: 'Compra mínima semestral de 150€'
  },
  {
    name: 'Hoja',
    minPoints: 90,
    maxPoints: 169,
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-800',
    icon: '🍃',
    baseBenefits: [
      'Todo lo anterior',
      'Descuentos exclusivos adicionales',
      'Acceso a recompensas premium'
    ],
    minPurchase: 300,
    purchaseText: 'Compra mínima semestral de 300€'
  },
  {
    name: 'Flor',
    minPoints: 170,
    maxPoints: Infinity,
    color: 'pink',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-800',
    icon: '🌸',
    baseBenefits: [
      'Todo lo anterior',
      'Asesoramiento personalizado sobre productos',
      'Acceso prioritario a eventos'
    ],
    minPurchase: 500,
    purchaseText: 'Compra mínima semestral de 500€'
  }
];

// Puntos y valor del cheque (valores fijos del sistema de recompensas)
const POINTS_FOR_VOUCHER = 50;
const VOUCHER_VALUE = 5; // Valor del cheque en euros

const ClientLevelDisplay: React.FC<ClientLevelDisplayProps> = ({ points, itemVariants }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generar beneficios dinámicos para cada nivel
  const getLevelBenefits = (baseBenefits: string[]) => {
    // Añadir el beneficio del cheque solo para el nivel Brote (primer nivel con recompensas)
    if (baseBenefits.includes('Acceso al catálogo de recompensas')) {
      return [
        ...baseBenefits,
        `Cheque ${VOUCHER_VALUE}€ al alcanzar ${POINTS_FOR_VOUCHER} puntos`
      ];
    }
    return baseBenefits;
  };

  // Generar niveles con beneficios dinámicos
  const LEVELS = BASE_LEVELS.map(level => ({
    ...level,
    benefits: getLevelBenefits(level.baseBenefits)
  }));

  // Determinar el nivel actual basado en los puntos
  const getCurrentLevel = (userPoints: number) => {
    return LEVELS.find(level => 
      userPoints >= level.minPoints && userPoints <= level.maxPoints
    ) || LEVELS[0];
  };

  // Obtener el siguiente nivel
  const getNextLevel = (currentLevel: typeof LEVELS[0]) => {
    const currentIndex = LEVELS.indexOf(currentLevel);
    return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
  };

  // Calcular progreso hacia el siguiente nivel
  const getProgressToNextLevel = (currentLevel: typeof LEVELS[0], userPoints: number) => {
    if (currentLevel.maxPoints === Infinity) {
      return 100; // Ya está en el nivel máximo
    }
    const pointsInCurrentLevel = userPoints - currentLevel.minPoints;
    const pointsNeededForLevel = currentLevel.maxPoints - currentLevel.minPoints + 1;
    return Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);
  };

  // Calcular puntos faltantes para el siguiente nivel
  const getPointsToNextLevel = (currentLevel: typeof LEVELS[0], userPoints: number) => {
    if (currentLevel.maxPoints === Infinity) {
      return 0; // Ya está en el nivel máximo
    }
    return currentLevel.maxPoints + 1 - userPoints;
  };

  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(currentLevel);
  const progress = getProgressToNextLevel(currentLevel, points);
  const pointsToNext = getPointsToNextLevel(currentLevel, points);

  return (
    <>
      <motion.div
        className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Nivel de Cliente</h3>
        
        {/* Nivel actual */}
        <div className={`p-4 ${currentLevel.bgColor} rounded-lg border ${currentLevel.borderColor} mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{currentLevel.icon}</span>
              <div>
                <div className={`font-bold text-lg ${currentLevel.textColor}`}>
                  Nivel {currentLevel.name}
                </div>
                <div className="text-sm text-gray-600">
                  {currentLevel.minPoints} - {currentLevel.maxPoints === Infinity ? '∞' : currentLevel.maxPoints} puntos
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
                <span>Progreso hacia {nextLevel.name}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className={`h-2.5 rounded-full ${currentLevel.bgColor.replace('100', '500')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" as const }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pointsToNext > 0 
                  ? `${pointsToNext} puntos para alcanzar ${nextLevel.name}`
                  : `¡Has alcanzado ${nextLevel.name}!`
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
            {currentLevel.purchaseText}
          </p>
        </div>

        {/* Beneficios del nivel actual */}
        <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-star text-yellow-500 mr-2"></i>
            <span className="font-medium text-gray-700">Beneficios de tu nivel</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {currentLevel.benefits.map((benefit, index) => (
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
            {LEVELS.map((level, index) => {
              const isActive = level.name === currentLevel.name;
              const isPast = points > level.maxPoints;
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    isActive ? level.bgColor : isPast ? 'bg-gray-100 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{level.icon}</span>
                    <div>
                      <div className={`font-medium ${isActive ? level.textColor : 'text-gray-700'}`}>
                        {level.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.minPoints} - {level.maxPoints === Infinity ? '∞' : level.maxPoints} pts
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <span className={`text-xs px-2 py-1 rounded-full ${level.bgColor} ${level.textColor} font-medium`}>
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