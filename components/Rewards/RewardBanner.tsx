'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompletedPetCard {
  id: number;
  petName: string;
  petType: string;
  productName: string;
  stamps: number;
  completed: boolean;
  createdAt: string;
  stampDates: string[];
}

interface RewardBannerProps {
  initialShow?: boolean;
}

const RewardBanner: React.FC<RewardBannerProps> = ({ initialShow = true }) => {
  const [hasCompletedCards, setHasCompletedCards] = useState(false);
  const [completedCards, setCompletedCards] = useState<CompletedPetCard[]>([]);
  const [isVisible, setIsVisible] = useState(initialShow);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedCards = async () => {
      try {
        const res = await fetch('/api/user/pet-cards');
        const data = await res.json();

        if (data.success && data.petCards && Array.isArray(data.petCards)) {
          const completed = data.petCards.filter(
            (card: any) => card.completed === 1 || card.completed === true
          );
          setCompletedCards(completed);
          setHasCompletedCards(completed.length > 0);
        }
      } catch (error) {
        console.error('Error al obtener carnets completados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedCards();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Si no hay carnets completados, no mostrar nada
  if (isLoading) {
    return null;
  }

  if (!hasCompletedCards || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="relative bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            
            {/* Contenido principal */}
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Imagen de recompensa */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex-shrink-0"
                >
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-xl border-4 border-white/30 bg-white">
                      <img
                        src="/reward_complete.png"
                        alt="Recompensa - Saco de pienso gratis"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si la imagen no carga, mostrar un placeholder
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-green-100"><span class="text-4xl">🎁</span></div>';
                          }
                        }}
                      />
                    </div>
                    {/* Halo de celebración */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-yellow-400"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                </motion.div>

                {/* Texto de felicitación */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1 text-center md:text-left"
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-2"
                  >
                    ¡Felicidades!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/90 text-lg mb-1"
                  >
                    Has completado tu{completedCards.length > 1 ? 's' : ''} carnet{completedCards.length > 1 ? 'es' : ''} de mascota
                    {completedCards.length > 1 ? '' : 's'}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap justify-center md:justify-start gap-2 mt-3"
                  >
                    {completedCards.map((card) => (
                      <span
                        key={card.id}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm"
                      >
                        <i className="fas fa-paw mr-2"></i>
                        {card.petName} - {card.productName}
                      </span>
                    ))}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-yellow-300 font-semibold mt-3"
                  >
                    <i className="fas fa-gift mr-2"></i>
                    ¡Tienes un saco de pienso gratis esperándote!
                  </motion.p>
                </motion.div>

                {/* Botón de cerrar */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 md:relative md:top-auto md:right-auto text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <i className="fas fa-times text-xl"></i>
                </motion.button>
              </div>
            </div>

            {/* Decoración inferior */}
            <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
          </div>

          {/* Animación de confeti/estrellas */}
          <div className="relative -mt-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400"
                initial={{
                  top: '50%',
                  left: `${15 + i * 14}%`,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  top: ['50%', '30%', '10%'],
                  scale: [0, 1, 0.5],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <i className="fas fa-star"></i>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardBanner;
