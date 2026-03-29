import { useState, useEffect } from 'react';

interface ExpirationConfig {
  caducidad_puntos_meses: number;
  caducidad_carnet_inactividad_meses: number;
  caducidad_carnet_antiguedad_meses: number;
  sellos_requeridos_carnet: number;
}

interface PointsConfig {
  eurosPorPunto: number;
  puntosBienvenida: number;
}

// Interfaz para los niveles de cliente
export interface ClientLevel {
  nivel: number;
  nombre: string;
  icono: string;
  puntosMinimos: number;
  puntosMaximos: number | null;
  eurosCompraMinima: number;
  activo: boolean;
}

interface AppConfig extends ExpirationConfig, PointsConfig {
  clientLevels: ClientLevel[];
}

interface UseAppConfigReturn {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

// Valores por defecto para niveles de cliente
const DEFAULT_CLIENT_LEVELS: ClientLevel[] = [
  { nivel: 1, nombre: 'Semilla', icono: 'S', puntosMinimos: 0, puntosMaximos: 49, eurosCompraMinima: 0, activo: true },
  { nivel: 2, nombre: 'Brote', icono: 'B', puntosMinimos: 50, puntosMaximos: 89, eurosCompraMinima: 150, activo: true },
  { nivel: 3, nombre: 'Hoja', icono: 'H', puntosMinimos: 90, puntosMaximos: 169, eurosCompraMinima: 300, activo: true },
  { nivel: 4, nombre: 'Flor', icono: 'F', puntosMinimos: 170, puntosMaximos: null, eurosCompraMinima: 500, activo: true },
];

// Hook principal que obtiene toda la configuración
export const useAppConfig = (): UseAppConfigReturn => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        // Usar /api/config que es público y no requiere autenticación
        const res = await fetch('/api/config');
        const data = await res.json();

        if (data.success && data.config) {
          setConfig({
            // Configuración de caducidad
            caducidad_puntos_meses: data.config.expiration?.caducidad_puntos_meses || 12,
            caducidad_carnet_inactividad_meses: data.config.expiration?.caducidad_carnet_inactividad_meses || 6,
            caducidad_carnet_antiguedad_meses: data.config.expiration?.caducidad_carnet_antiguedad_meses || 24,
            sellos_requeridos_carnet: data.config.expiration?.sellos_requeridos_carnet || 6,
            // Configuración de puntos
            eurosPorPunto: data.config.eurosPorPunto || 3.5,
            puntosBienvenida: data.config.puntosBienvenida || 5,
            // Niveles de cliente
            clientLevels: data.config.clientLevels && data.config.clientLevels.length > 0 
              ? data.config.clientLevels 
              : DEFAULT_CLIENT_LEVELS,
          });
        } else {
          // Usar valores por defecto si no se puede obtener la configuración
          setConfig({
            caducidad_puntos_meses: 12,
            caducidad_carnet_inactividad_meses: 6,
            caducidad_carnet_antiguedad_meses: 24,
            sellos_requeridos_carnet: 6,
            eurosPorPunto: 3.5,
            puntosBienvenida: 5,
            clientLevels: DEFAULT_CLIENT_LEVELS,
          });
        }
      } catch (err) {
        console.error('Error al obtener configuración de la app:', err);
        setError('Error al cargar configuración');
        // Usar valores por defecto en caso de error
        setConfig({
          caducidad_puntos_meses: 12,
          caducidad_carnet_inactividad_meses: 6,
          caducidad_carnet_antiguedad_meses: 24,
          sellos_requeridos_carnet: 6,
          eurosPorPunto: 3.5,
          puntosBienvenida: 5,
          clientLevels: DEFAULT_CLIENT_LEVELS,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};

// Hook para caducidades (mantenido por compatibilidad)
export const useExpirationConfig = (): { config: ExpirationConfig | null; loading: boolean; error: string | null } => {
  const { config, loading, error } = useAppConfig();
  
  return {
    config: config ? {
      caducidad_puntos_meses: config.caducidad_puntos_meses,
      caducidad_carnet_inactividad_meses: config.caducidad_carnet_inactividad_meses,
      caducidad_carnet_antiguedad_meses: config.caducidad_carnet_antiguedad_meses,
      sellos_requeridos_carnet: config.sellos_requeridos_carnet,
    } : null,
    loading,
    error,
  };
};

// Hook para obtener solo los niveles de cliente
export const useClientLevels = (): { clientLevels: ClientLevel[]; loading: boolean; error: string | null } => {
  const { config, loading, error } = useAppConfig();
  
  return {
    clientLevels: config?.clientLevels || DEFAULT_CLIENT_LEVELS,
    loading,
    error,
  };
};

export default useAppConfig;
