import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { User } from '@/types/user';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

interface PointExpirationItem {
  id: number;
  puntos: number;
  fechaIngreso: string;
  fechaCaducidad: string;
  caducado: boolean;
  diasRestantes: number;
}

interface ExpirationSummary {
  puntosActivos: number;
  puntosCaducados: number;
  resumenPorMes: {
    mesAno: string;
    puntos: number;
  }[];
}

interface UserPointsExpirationTabProps {
  user: User;
}

const UserPointsExpirationTab: React.FC<UserPointsExpirationTabProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expirationData, setExpirationData] = useState<PointExpirationItem[]>([]);
  const [summary, setSummary] = useState<ExpirationSummary | null>(null);

  useEffect(() => {
    const fetchExpirationData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/users/${user.id}/expiration-points`);
        
        if (!response.ok) {
          throw new Error('No se pudo obtener la información de caducidad de puntos');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setExpirationData(data.detalle);
          setSummary(data.resumen);
        } else {
          throw new Error(data.message || 'Error al cargar datos de caducidad');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.id) {
      fetchExpirationData();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const formatMonthYear = (monthYearString: string) => {
    const [year, month] = monthYearString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formattedMonth = format(date, 'MMMM', { locale: es }).toLowerCase();
    return `${formattedMonth} ${year}`;
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner size="md" variant="leaf" message="Cargando información de caducidad..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-6 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-medium flex items-center">
          <i className="fas fa-exclamation-circle mr-2"></i>
          Error al cargar datos
        </h3>
        <p className="mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  if (!summary || expirationData.length === 0) {
    return (
      <div className="py-6 text-center text-gray-500">
        <i className="fas fa-calendar-times text-3xl mb-2"></i>
        <p>Este usuario no tiene registros de caducidad de puntos.</p>
        <p className="text-sm mt-1">Los puntos se registran con su fecha de caducidad cuando son añadidos al usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-green-800 mb-4">Resumen de Caducidad</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-green-700">Puntos Activos</p>
                <p className="text-xl font-semibold text-green-800">{summary.puntosActivos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-md">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <i className="fas fa-times-circle text-red-600"></i>
              </div>
              <div>
                <p className="text-sm text-red-700">Puntos Caducados</p>
                <p className="text-xl font-semibold text-red-800">{summary.puntosCaducados}</p>
              </div>
            </div>
          </div>
        </div>
        
        {summary.resumenPorMes && summary.resumenPorMes.length > 0 && (
          <div>
            <h4 className="font-medium text-green-800 mb-2">Calendario de Caducidad</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {summary.resumenPorMes.map((item) => (
                <div 
                  key={item.mesAno}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                >
                  <span className="font-medium capitalize">{formatMonthYear(item.mesAno)}</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-sm">
                    {item.puntos} puntos
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-green-800 mb-4">Detalle de Puntos</h3>
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-60 border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Puntos
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha Ingreso
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha Caducidad
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Días Restantes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {expirationData.map((item) => (
                  <tr key={item.id} className={item.caducado ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 border-r border-gray-200">{item.puntos}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{formatDateTime(item.fechaIngreso)}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{formatDateTime(item.fechaCaducidad)}</td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      {item.caducado ? (
                        <span className="text-red-500">Caducado</span>
                      ) : (
                        <span className="text-green-500">Activo</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.caducado ? (
                        <span className="text-red-600">0</span>
                      ) : (
                        <span className={`${item.diasRestantes < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                          {item.diasRestantes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPointsExpirationTab;