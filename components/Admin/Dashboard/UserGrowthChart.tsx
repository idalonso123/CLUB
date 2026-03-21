import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useUserGrowthData } from '@/hooks/useUserGrowthData';

interface UserGrowthChartProps {
  period?: 'week' | 'month' | 'year';
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ period = 'month' }) => {
  const { chartData, loading, error } = useUserGrowthData(period);

  // Formatear la fecha según el período
  const formatXAxis = (date: string) => {
    if (!date) return '';
    
    try {
      if (period === 'week') {
        // Para período semanal, mostramos el día
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      } else if (period === 'month') {
        // Para período mensual, mostramos día/mes
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      } else if (period === 'year') {
        // Para período anual, mostramos mes/año
        return date;
      }
      return date;
    } catch (e) {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-500">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            dy={10}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} usuarios`, 'Nuevos Registros']}
            labelFormatter={(date) => `Fecha: ${formatXAxis(date)}`}
          />
          <Bar 
            dataKey="value" 
            name="Nuevos Usuarios" 
            fill="#10B981" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;