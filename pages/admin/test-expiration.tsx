import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

interface PointRecord {
  id: number;
  persona_id: number;
  puntos: number;
  fecha_ingreso: string;
  fecha_caducidad: string;
  caducado: number;
  dias_hasta_caducidad: number;
  nombre?: string;
}

interface PetCardRecord {
  id: number;
  persona_id?: number;
  petName?: string;
  petType?: string;
  stamps: number;
  stamp_dates?: string[];
  expirationDate?: string;
  createdAt: string;
  maxExpirationDate?: string;
  dias_hasta_inactividad?: number;
  dias_hasta_limite?: number;
  completed?: number;
  isExpired?: number;
  // Campos para simulación
  simulatedInactivity?: number | null;
  simulatedMaxMonths?: number | null;
}

const TestExpirationPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [points, setPoints] = useState<PointRecord[]>([]);
  const [petCards, setPetCards] = useState<PetCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [runningCron, setRunningCron] = useState<'points' | 'pets' | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [selectedPetCard, setSelectedPetCard] = useState<number | null>(null);
  const [simulationMode, setSimulationMode] = useState(false); // Modo peligroso desactivado por defecto

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener puntos activos usando la API
      const pointsResponse = await fetch('/api/admin/test-expiration/points');
      const pointsData = await pointsResponse.json();
      
      // Obtener carnets activos usando la API
      const petCardsResponse = await fetch('/api/admin/test-expiration/pet-cards');
      const petCardsData = await petCardsResponse.json();
      
      if (pointsData.success) {
        setPoints(pointsData.points || []);
      }
      
      if (petCardsData.success) {
        setPetCards((petCardsData.petCards || []).map((card: PetCardRecord) => ({
          ...card,
          simulatedInactivity: null,
          simulatedMaxMonths: null
        })));
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const runCronJob = async (type: 'points' | 'pets') => {
    try {
      setRunningCron(type);
      setMessage(null);
      
      const endpoint = type === 'points' 
        ? '/api/cron/check-expired-points' 
        : '/api/cron/check-expired-pet-cards';
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: type === 'points'
            ? `Se procesaron ${data.processed || 0} puntos caducados`
            : `Se eliminaron ${data.deletedCount || 0} carnets caducados`
        });
        // Recargar datos
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al ejecutar el cron job' });
      }
    } catch (error) {
      console.error('Error al ejecutar cron job:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setRunningCron(null);
    }
  };

  const simulateExpiredPoint = async (daysAgo: number) => {
    if (!selectedPoint) {
      setMessage({ type: 'error', text: 'Selecciona un punto primero' });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/test-expiration/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'simulateExpired',
          id: selectedPoint,
          days: daysAgo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al modificar el punto' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al modificar el punto' });
    } finally {
      setLoading(false);
    }
  };

  const simulateExpiringSoonPoint = async (daysUntil: number) => {
    if (!selectedPoint) {
      setMessage({ type: 'error', text: 'Selecciona un punto primero' });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/test-expiration/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'simulateExpiringSoon',
          id: selectedPoint,
          days: daysUntil
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al modificar el punto' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al modificar el punto' });
    } finally {
      setLoading(false);
    }
  };

  const simulateExpiredPetCard = (type: 'inactivity' | 'max', daysAgoOrMonths: number) => {
    if (!selectedPetCard) {
      setMessage({ type: 'error', text: 'Selecciona un carnet primero' });
      return;
    }

    // Modo simulación: solo actualiza la UI, no la base de datos
    if (simulationMode) {
      setPetCards(prevCards => prevCards.map(card => {
        if (card.id === selectedPetCard) {
          if (type === 'inactivity') {
            return { ...card, simulatedInactivity: -daysAgoOrMonths };
          } else {
            return { ...card, simulatedMaxMonths: daysAgoOrMonths };
          }
        }
        return card;
      }));
      setMessage({ 
        type: 'success', 
        text: `Modo simulación: verías el carnet como ${type === 'inactivity' ? `inactivo hace ${daysAgoOrMonths} días` : `con ${daysAgoOrMonths} meses de edad`}. Haz clic en "Aplicar Cambios" para modificar la base de datos.` 
      });
      return;
    }

    // Modo normal: modifica la base de datos
    performPetCardSimulation(type, daysAgoOrMonths);
  };

  const performPetCardSimulation = async (type: 'inactivity' | 'max', daysAgoOrMonths: number) => {
    try {
      setLoading(true);
      
      const action = type === 'inactivity' ? 'simulateInactivity' : 'simulateMaxLimit';
      
      const response = await fetch('/api/admin/test-expiration/pet-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          id: selectedPetCard,
          days: type === 'inactivity' ? daysAgoOrMonths : undefined,
          months: type === 'max' ? daysAgoOrMonths : undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al modificar el carnet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al modificar el carnet' });
    } finally {
      setLoading(false);
    }
  };

  const applySimulation = () => {
    const card = petCards.find(c => c.id === selectedPetCard);
    if (!card) return;

    if (card.simulatedInactivity != null) {
      performPetCardSimulation('inactivity', Math.abs(card.simulatedInactivity));
    } else if (card.simulatedMaxMonths != null) {
      performPetCardSimulation('max', card.simulatedMaxMonths);
    }
  };

  const resetPoint = async () => {
    if (!selectedPoint) {
      setMessage({ type: 'error', text: 'Selecciona un punto primero' });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/test-expiration/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          id: selectedPoint
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al restaurar el punto' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al restaurar el punto' });
    } finally {
      setLoading(false);
    }
  };

  const resetPetCard = async () => {
    if (!selectedPetCard) {
      setMessage({ type: 'error', text: 'Selecciona un carnet primero' });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/test-expiration/pet-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          id: selectedPetCard
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al restaurar el carnet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al restaurar el carnet' });
    } finally {
      setLoading(false);
    }
  };

  // Calcular los días de inactividad simulados para un carnet
  const getSimulatedInactivityDays = (card: PetCardRecord): number | null => {
    if (card.simulatedInactivity != null) {
      return card.simulatedInactivity;
    }
    return card.dias_hasta_inactividad ?? null;
  };

  // Calcular los días hasta el límite máximo simulados
  const getSimulatedMaxDays = (card: PetCardRecord): number => {
    if (card.simulatedMaxMonths != null) {
      const now = new Date();
      const createdDate = new Date(card.createdAt);
      const simulatedCreatedDate = new Date();
      simulatedCreatedDate.setMonth(simulatedCreatedDate.getMonth() - card.simulatedMaxMonths);
      
      const maxExpiration = new Date(simulatedCreatedDate);
      maxExpiration.setMonth(maxExpiration.getMonth() + 24);
      
      return Math.ceil((maxExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    return card.dias_hasta_limite ?? 0;
  };

  if (authLoading || loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Prueba de Caducidades - Club ViveVerde</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Prueba de Caducidades
            </h1>
            <p className="text-gray-600">
              Herramienta para probar la caducidad de puntos y carnets de mascotas
            </p>
          </motion.div>

          {/* Mensaje */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Instrucciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"
          >
            <h2 className="font-semibold text-red-800 mb-2">Modo Peligroso (PELIGRO - modifica la base de datos):</h2>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Selecciona un punto o carnet de la lista</li>
              <li>Haz clic en los botones de simulación</li>
              <li>Los cambios se aplican <strong>INMEDIATAMENTE</strong> a la base de datos</li>
              <li>Ejecuta el cron job para procesar las caducidades</li>
              <li>Para modo seguro, activa el checkbox "Modo Simulación"</li>
            </ol>
          </motion.div>

          {/* Selector de modo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulationMode}
                  onChange={(e) => setSimulationMode(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700 font-medium">Modo Simulación</span>
              </label>
              <span className="text-sm text-gray-500">
                {simulationMode 
                  ? 'Los cambios se muestran en pantalla sin modificar la base de datos' 
                  : 'Los cambios se aplican directamente a la base de datos'}
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sección de Puntos */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Puntos (12 meses)</h2>
                <button
                  onClick={() => runCronJob('points')}
                  disabled={runningCron === 'points'}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    runningCron === 'points'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {runningCron === 'points' ? 'Ejecutando...' : 'Ejecutar Cron Job'}
                </button>
              </div>

              {/* Controles */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Acciones para punto seleccionado (ID: {selectedPoint || 'Ninguno'}):</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => simulateExpiredPoint(1)}
                    disabled={!selectedPoint}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                  >
                    Caducado (hace 1 día)
                  </button>
                  <button
                    onClick={() => simulateExpiredPoint(400)}
                    disabled={!selectedPoint}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
                  >
                    Caducado (hace +1 año)
                  </button>
                  <button
                    onClick={() => simulateExpiringSoonPoint(5)}
                    disabled={!selectedPoint}
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-gray-300"
                  >
                    Caduca en 5 días
                  </button>
                  <button
                    onClick={() => simulateExpiringSoonPoint(30)}
                    disabled={!selectedPoint}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:bg-gray-300"
                  >
                    Caduca en 30 días
                  </button>
                  <button
                    onClick={resetPoint}
                    disabled={!selectedPoint}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
                  >
                    Restaurar (12 meses)
                  </button>
                </div>
              </div>

              {/* Lista de Puntos */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {points.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay puntos activos</p>
                ) : (
                  points.map((point) => (
                    <div
                      key={point.id}
                      onClick={() => setSelectedPoint(point.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPoint === point.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">ID: {point.id} - {point.nombre}</p>
                          <p className="text-sm text-gray-600">{point.puntos} puntos</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            point.dias_hasta_caducidad < 0
                              ? 'text-red-600'
                              : point.dias_hasta_caducidad <= 30
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}>
                            {point.dias_hasta_caducidad < 0
                              ? `Caducado hace ${Math.abs(point.dias_hasta_caducidad)} días`
                              : `${point.dias_hasta_caducidad} días`
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(point.fecha_caducidad).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Sección de Carnets de Mascotas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Carnets Mascotas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={applySimulation}
                    disabled={!selectedPetCard || !simulationMode}
                    className={`px-3 py-2 rounded-lg font-medium text-sm ${
                      !selectedPetCard || !simulationMode
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Aplica los cambios simulados a la base de datos"
                  >
                    Aplicar Cambios
                  </button>
                  <button
                    onClick={() => runCronJob('pets')}
                    disabled={runningCron === 'pets'}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      runningCron === 'pets'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white text-sm`}
                  >
                    {runningCron === 'pets' ? 'Ejecutando...' : 'Ejecutar Cron Job'}
                  </button>
                </div>
              </div>

              {/* Controles */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Acciones para carnet seleccionado (ID: {selectedPetCard || 'Ninguno'}):</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => simulateExpiredPetCard('inactivity', 200)}
                    disabled={!selectedPetCard}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                  >
                    Inactivo (+6 meses)
                  </button>
                  <button
                    onClick={() => simulateExpiredPetCard('inactivity', 10)}
                    disabled={!selectedPetCard}
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-gray-300"
                  >
                    Inactivo (10 días)
                  </button>
                  <button
                    onClick={() => simulateExpiredPetCard('max', 25)}
                    disabled={!selectedPetCard}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
                  >
                    Límite 25 meses
                  </button>
                  <button
                    onClick={() => simulateExpiredPetCard('max', 23)}
                    disabled={!selectedPetCard}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-300"
                  >
                    Límite 23 meses
                  </button>
                  <button
                    onClick={resetPetCard}
                    disabled={!selectedPetCard}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
                  >
                    Restaurar
                  </button>
                </div>
              </div>

              {/* Lista de Carnets */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {petCards.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay carnets activos</p>
                ) : (
                  petCards.map((card) => {
                    const diasInactividad = getSimulatedInactivityDays(card);
                    const diasLimite = getSimulatedMaxDays(card);
                    
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedPetCard(card.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPetCard === card.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">ID: {card.id} - {card.petName || 'Sin nombre'}</p>
                            <p className="text-sm text-gray-600">{card.stamps || 0}/6 sellos</p>
                            {card.simulatedInactivity != null && (
                              <p className="text-xs text-blue-600 mt-1">
                                Simulado: inactivo hace {Math.abs(card.simulatedInactivity ?? 0)} días
                              </p>
                            )}
                            {card.simulatedMaxMonths != null && (
                              <p className="text-xs text-blue-600 mt-1">
                                Simulado: {card.simulatedMaxMonths} meses de edad
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              diasInactividad !== null && diasInactividad < 0
                                ? 'text-red-600'
                                : diasInactividad !== null && diasInactividad <= 30
                                ? 'text-orange-600'
                                : diasLimite <= 30
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {diasInactividad !== null && diasInactividad < 0
                                ? `Inactivo`
                                : diasInactividad !== null
                                ? `${diasInactividad}d inact.`
                                : ''
                              }
                              {diasLimite <= 30 && diasLimite > 0 && ` • ${diasLimite}d límite`}
                              {diasLimite < 0 && ` • Límite excedido`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Creado: {new Date(card.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Leyenda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">Leyenda de Colores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Caducado / Límite excedido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Próximo a caducar (menos de 30 días)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Activo / Tiempo suficiente</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TestExpirationPage;
