import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpirationPoint {
  id: number;
  puntos: number;
  fecha_ingreso: string;
  fecha_caducidad: string;
  caducado: number;
  diasRestantes: number;
}

interface ExpirationSummary {
  mesAno: string;
  puntos: number;
}

interface ExpirationData {
  puntosActivos: number;
  puntosCaducados: number;
  resumenPorMes: ExpirationSummary[];
  detalle: ExpirationPoint[];
}

export default function usePointsExpiration() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expirationData, setExpirationData] = useState<ExpirationData | null>(null);
  
  useEffect(() => {
    const fetchExpirationData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/expiration-points');
        
        if (!response.ok) {
          throw new Error('Error al obtener los datos de caducidad de puntos');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setExpirationData(data.expiration);
        } else {
          throw new Error(data.message || 'Error desconocido');
        }
      } catch (err) {
        console.error('Error en usePointsExpiration:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos de caducidad');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpirationData();
  }, []);
  
  // Formatea el mes y año para mostrar (ej: "Junio 2026")
  const formatMonthYear = (monthYearString: string) => {
    const [year, month] = monthYearString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formattedMonth = format(date, 'MMMM', { locale: es });
    // Capitalizar la primera letra del mes
    const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);
    return `${capitalizedMonth} ${year}`;
  };
  
  // Formatea la fecha completa con hora (DD/MM/YYYY HH:mm)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };
  
  return {
    isLoading,
    error,
    expirationData,
    formatMonthYear,
    formatDate
  };
}
