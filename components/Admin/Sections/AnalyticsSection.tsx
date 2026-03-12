import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  visitsByDay: {
    labels: string[];
    values: number[];
  };
  deviceUsage: {
    labels: string[];
    values: number[];
  };
  topPages: {
    page: string;
    views: number;
    avgTimeOnPage: string;
  }[];
  userMetrics: {
    users: number;
    newUsers: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: string;
  };
  usersByCountry: {
    country: string;
    users: number;
  }[];
}

const AnalyticsSection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [error, setError] = useState<string | null>(null);
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/data?period=${dateRange}`);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        setAnalyticsData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('No se pudieron cargar los datos de Analytics. Por favor, inténtalo de nuevo más tarde.');
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [dateRange]);
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent mb-4"></div>
        <p className="text-green-800 font-medium">Cargando datos...</p>
      </div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-green-800 mb-6">Google Analytics</h1>
        <p className="text-gray-600 mb-4">
          Visualiza las estadísticas de Google Analytics para el sitio web de Club ViveVerde.
        </p>
      </motion.div>
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-xl font-semibold mb-3 sm:mb-0">Panel de Google Analytics</h2>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="last7days">Últimos 7 días</option>
              <option value="last30days">Últimos 30 días</option>
              <option value="last90days">Últimos 90 días</option>
              <option value="lastYear">Último año</option>
            </select>
            <button 
              onClick={() => setDateRange(dateRange)}
              className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200 transition-colors duration-200"
            >
              <i className="fas fa-sync-alt mr-1"></i> Actualizar
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent"></div>
          </div>
        ) : analyticsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white mr-3">
                    <i className="fas fa-users text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Usuarios</p>
                    <p className="text-2xl font-bold">{analyticsData.userMetrics.users.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white mr-3">
                    <i className="fas fa-chart-line text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sesiones</p>
                    <p className="text-2xl font-bold">{analyticsData.userMetrics.sessions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white mr-3">
                    <i className="fas fa-arrow-right text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tasa de rebote</p>
                    <p className="text-2xl font-bold">{analyticsData.userMetrics.bounceRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white mr-3">
                    <i className="fas fa-clock text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duración media</p>
                    <p className="text-2xl font-bold">{analyticsData.userMetrics.avgSessionDuration}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Visitas por día</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={{
                    labels: analyticsData.visitsByDay.labels,
                    datasets: [
                      {
                        label: 'Visitas',
                        data: analyticsData.visitsByDay.values,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Uso por dispositivo</h3>
                <div style={{ height: '250px' }} className="flex justify-center">
                  <Doughnut 
                    data={{
                      labels: analyticsData.deviceUsage.labels,
                      datasets: [
                        {
                          data: analyticsData.deviceUsage.values,
                          backgroundColor: [
                            '#10B981', 
                            '#3B82F6', 
                            '#F59E0B'
                          ],
                          borderWidth: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      cutout: '65%'
                    }}
                  />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Páginas más visitadas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Página</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vistas</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo medio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analyticsData.topPages.map((page, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-2 text-sm text-gray-900">{page.page}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{page.views.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{page.avgTimeOnPage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Usuarios por país</h3>
              <div style={{ height: '300px' }}>
                <Bar 
                  data={{
                    labels: analyticsData.usersByCountry.map(item => item.country),
                    datasets: [
                      {
                        label: 'Usuarios',
                        data: analyticsData.usersByCountry.map(item => item.users),
                        backgroundColor: '#10B981'
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-2">Acceso directo</h3>
            <p className="text-sm text-gray-600 mb-3">Para acceder directamente a Google Analytics, haz clic en el botón de abajo:</p>
            <a 
              href="https://analytics.google.com/analytics/web/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              Abrir Google Analytics
            </a>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Integración con la API de Google Analytics</h3>
            <p className="text-sm text-blue-700">
              Esta sección utiliza datos de la API de Google Analytics. Los datos se obtienen a través de nuestro endpoint 
              <code className="bg-blue-100 px-1 rounded">/api/analytics/data</code>. 
              Para configurar la integración con datos reales.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsSection;