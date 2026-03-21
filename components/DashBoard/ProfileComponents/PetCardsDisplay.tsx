import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PetCard } from '@/types/teller';

interface PetCardsDisplayProps {
  itemVariants: any;
}

const PetCardsDisplay: React.FC<PetCardsDisplayProps> = ({ itemVariants }) => {
  const [petCards, setPetCards] = useState<PetCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    const fetchPetCards = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/user/pet-cards');
        const data = await res.json();

        if (data.success) {
          setPetCards(data.petCards);
        } else {
          setError(data.message || 'Error al cargar los carnets');
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetCards();
  }, []);

  // Filtrar carnets según el estado seleccionado
  const filteredPetCards = React.useMemo(() => {
    if (filterStatus === 'all') return petCards;
    if (filterStatus === 'active') return petCards.filter(card => !card.completed);
    if (filterStatus === 'completed') return petCards.filter(card => card.completed);
    return petCards;
  }, [petCards, filterStatus]);

  if (isLoading) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-green-700 mb-4">Mis Carnets mascotas</h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-green-700 mb-4">Mis Carnets mascotas</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      </motion.div>
    );
  }

  if (petCards.length === 0) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-green-700 mb-4">Mis Carnets mascotas</h3>
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-paw text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500">No tienes carnets animales activos.</p>
          <p className="text-sm text-gray-400 mt-2">
            Visita nuestra tienda para obtener tu carnet animal y empezar a acumular sellos.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-6 mb-6"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-green-700 mb-2">Mis Carnets mascotas</h3>
      
      <div className="mb-4 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setIsInfoOpen(!isInfoOpen)} 
          className="w-full p-3 cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between focus:outline-none hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-2 text-green-600"></i>
            Tarjeta de Sacos – Condiciones Específicas
          </div>
          <motion.div
            animate={{ rotate: isInfoOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <i className="fas fa-chevron-down text-green-600"></i>
          </motion.div>
        </button>
        
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isInfoOpen ? 'auto' : 0,
            opacity: isInfoOpen ? 1 : 0
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="overflow-hidden"
        >
          <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: isInfoOpen ? 0 : 10, opacity: isInfoOpen ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              Los carnets animales son una iniciativa de Club ViveVerde para promover el cuidado y bienestar animal.
            </motion.p>
            
            <motion.ul 
              className="list-disc pl-5 space-y-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: isInfoOpen ? 0 : 10, opacity: isInfoOpen ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <li>Es necesario tener activa la Tarjeta de Fidelidad ViveVerde para disfrutar de la Tarjeta de Pienso.</li>
              <li>Se sella la tarjeta cada vez que se compre un saco de pienso de la misma marca, sabor y peso.</li>
              <li>Al completar el número de compras indicado (por ejemplo, 10), el siguiente saco es gratuito.</li>
              <li>Solo se permite cambiar el tipo de pienso si no hay disponibilidad, y solo por uno equivalente o inferior de la misma marca.</li>
              <li>No se puede acumular puntos de fidelidad y sellar la Tarjeta de Pienso por la misma compra (son excluyentes).</li>
              <li>En compras mixtas (pienso y otros productos), puedes sellar la Tarjeta de Pienso por el pienso y acumular puntos por el resto.</li>
              <li>Los sellos se aplican únicamente en el momento de la compra, presentando la tarjeta correspondiente.</li>
            </motion.ul>
          </div>
        </motion.div>
      </div>
      
      {petCards.length > 0 && (
        <div className="flex mb-4 border border-gray-200 rounded-md overflow-hidden">
          <button 
            className={`flex-1 py-2 text-xs font-medium ${filterStatus === "all" ? "bg-green-100 text-green-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setFilterStatus("all")}
          >
            Todos ({petCards.length})
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium ${filterStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setFilterStatus("active")}
          >
            Activos ({petCards.filter(card => !card.completed).length})
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium ${filterStatus === "completed" ? "bg-green-100 text-green-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setFilterStatus("completed")}
          >
            Completados ({petCards.filter(card => card.completed).length})
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-128 overflow-y-auto">
        {filteredPetCards.map((card) => (
          <div 
            key={card.id}
            className={`border rounded-lg overflow-hidden shadow-sm ${card.completed ? 'border-green-500' : 'border-gray-200'}`}
          >
            <div className={`p-3 ${card.completed ? 'bg-green-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-800">{card.petName}</h4>
                  <p className="text-sm text-gray-500">{card.petType}</p>
                  <p className="text-xs text-green-600 mt-1">
                    <i className="fas fa-shopping-bag mr-1"></i>
                    {card.productName}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${card.completed ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-800'}`}>
                  {card.completed ? 'Completado - Saco Regalo' : `${card.stamps}/6 Sellos`}
                </div>
              </div>
              
              <div className="mb-2">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 6 }).map((_, index) => {
                    // Obtener la fecha del sello si existe
                    let stampDate = null;
                    try {
                      const stampDates = card.stampDates || [];
                      if (index < stampDates.length) {
                        stampDate = stampDates[index];
                      }
                    } catch (e) {
                      // Ignorar errores si stampDates no es un array válido
                    }
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className={`aspect-square rounded-md flex items-center justify-center border w-full relative ${
                            index < card.stamps 
                              ? 'bg-green-100 border-green-300' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                        {stampDate && index < card.stamps && (
                            index === 5 ? (
                            <img
                            src="/icons/icon-saco.png"
                            alt="Saco - Club ViveVerde"
                            style={{ width: '40px', height: '40px' }}
                            />
                          ) : (
                          <img
                          src="/icons/icon-128x128.png"
                          alt="Sello - Club ViveVerde"
                          style={{ width: '40px', height: '40px' }}
                          />
                        )
                      )}
                        </div>
                        {stampDate && (
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {new Date(stampDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>Creado: {new Date(card.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PetCardsDisplay;
