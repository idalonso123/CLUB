import { useState, useEffect } from 'react';

interface ExpirationConfig {
  caducidad_puntos_meses: number;
  caducidad_carnet_inactividad_meses: number;
  caducidad_carnet_antiguedad_meses: number;
}

interface PointsConfig {
  eurosPorPunto: number;
  puntosBienvenida: number;
}

interface AppConfig extends ExpirationConfig, PointsConfig {}

interface UseAppConfigReturn {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

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
            // Configuración de puntos
            eurosPorPunto: data.config.eurosPorPunto || 3.5,
            puntosBienvenida: data.config.puntosBienvenida || 5,
          });
        } else {
          // Usar valores por defecto si no se puede obtener la configuración
          setConfig({
            caducidad_puntos_meses: 12,
            caducidad_carnet_inactividad_meses: 6,
            caducidad_carnet_antiguedad_meses: 24,
            eurosPorPunto: 3.5,
            puntosBienvenida: 5,
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
          eurosPorPunto: 3.5,
          puntosBienvenida: 5,
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
    } : null,
    loading,
    error,
  };
};

export default useAppConfig;
