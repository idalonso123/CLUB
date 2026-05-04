import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CarnetHistoryItem {
  id: number;
  nombrePienso: string;
  productBarcode: string | null;
  petName: string;
  petType: string;
  fechaCanje: string;
}

interface PetCardsHistoryProps {
  itemVariants: any;
}

const PetCardsHistory: React.FC<PetCardsHistoryProps> = ({ itemVariants }) => {
  const [history, setHistory] = useState<CarnetHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/user/pet-cards/history');
        const data = await res.json();

        if (data.success) {
          setHistory(data.history || []);
        } else {
          setError(data.message || 'Error al cargar el historial');
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Función para formatear fecha
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-green-700 mb-4">Historial de Carnets Completados</h3>
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
        <h3 className="text-lg font-semibold text-green-700 mb-4">Historial de Carnets Completados</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-6 mb-6"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-green-700 mb-4">Historial de Carnets Completados</h3>
      
      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-history text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500">No tienes carnets completados en el historial.</p>
          <p className="text-sm text-gray-400 mt-2">
            Completa un carnet de mascota para obtener tu saco de pienso gratis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-green-200 rounded-lg p-4 bg-green-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <i className="fas fa-gift text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 text-lg">
                      {item.nombrePienso}
                    </h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <i className="fas fa-paw mr-2 text-green-500"></i>
                        {item.petName}
                        {item.petType && ` (${item.petType})`}
                      </p>
                      {item.productBarcode && (
                        <p className="flex items-center">
                          <i className="fas fa-barcode mr-2 text-green-500"></i>
                          Ref: {item.productBarcode}
                        </p>
                      )}
                      <p className="flex items-center">
                        <i className="fas fa-calendar-check mr-2 text-green-500"></i>
                        Canjeado: {formatDate(item.fechaCanje)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i className="fas fa-check-circle mr-1"></i>
                    Canjeado
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PetCardsHistory;
