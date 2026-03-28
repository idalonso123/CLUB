import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ExpirationConfig {
  caducidad_puntos_meses: number;
  caducidad_carnet_inactividad_meses: number;
  caducidad_carnet_antiguedad_meses: number;
}

interface ConfigData {
  eurosPorPunto: number;
  puntosBienvenida: number;
  tellerRewards: {
    rewardIds: number[];
    showAllRewards: boolean;
  };
  expiration: ExpirationConfig;
}

export const useConfig = (autoLoad = false) => {
  // Estados para la configuración y carga
  const [config, setConfig] = useState<ConfigData>({ 
    eurosPorPunto: 3.5,
    puntosBienvenida: 5,
    tellerRewards: {
      rewardIds: [],
      showAllRewards: true
    },
    expiration: {
      caducidad_puntos_meses: 12,
      caducidad_carnet_inactividad_meses: 6,
      caducidad_carnet_antiguedad_meses: 24
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar la configuración
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/config');
      
      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }
      
      const data = await response.json();
      if (data.success) {
        setConfig({
          eurosPorPunto: data.config?.eurosPorPunto || 3.5,
          puntosBienvenida: data.config?.puntosBienvenida || 5,
          tellerRewards: data.config?.tellerRewards || {
            rewardIds: [],
            showAllRewards: true
          },
          expiration: data.config?.expiration || {
            caducidad_puntos_meses: 12,
            caducidad_carnet_inactividad_meses: 6,
            caducidad_carnet_antiguedad_meses: 24
          }
        });
      } else {
        throw new Error(data.message || 'Error al cargar la configuración');
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      setError((error as Error).message);
      toast.error('No se pudo cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para guardar la configuración
  const saveConfig = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Validar que eurosPorPunto no sea cero o negativo
      if (config.eurosPorPunto <= 0) {
        throw new Error('El valor debe ser mayor que cero');
      }
      
      // Asegurarse de que eurosPorPunto sea un número
      const eurosPorPuntoValue = Number(config.eurosPorPunto);
      if (isNaN(eurosPorPuntoValue)) {
        throw new Error('El valor debe ser un número válido');
      }
      
      const puntosBienvenidaValue = Number(config.puntosBienvenida);
      if (isNaN(puntosBienvenidaValue) || puntosBienvenidaValue < 0 || !Number.isInteger(puntosBienvenidaValue)) {
        throw new Error('Los puntos de bienvenida deben ser un número entero positivo');
      }
      
      // Validar configuraciones de caducidad
      const { expiration } = config;
      if (
        !Number.isInteger(expiration.caducidad_puntos_meses) || expiration.caducidad_puntos_meses < 1 ||
        !Number.isInteger(expiration.caducidad_carnet_inactividad_meses) || expiration.caducidad_carnet_inactividad_meses < 1 ||
        !Number.isInteger(expiration.caducidad_carnet_antiguedad_meses) || expiration.caducidad_carnet_antiguedad_meses < 1
      ) {
        throw new Error('Las configuraciones de caducidad deben ser números enteros positivos');
      }
      
      console.log('Enviando configuración:', { 
        eurosPorPunto: eurosPorPuntoValue,
        puntosBienvenida: puntosBienvenidaValue,
        tellerRewards: config.tellerRewards,
        expiration: config.expiration
      });
      
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          eurosPorPunto: eurosPorPuntoValue,
          puntosBienvenida: puntosBienvenidaValue,
          tellerRewards: config.tellerRewards,
          expiration: config.expiration
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Configuración guardada correctamente');
        return true;
      } else {
        throw new Error(data.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      setError((error as Error).message);
      toast.error((error as Error).message || 'No se pudo guardar la configuración');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  // Función para actualizar la configuración
  const updateConfig = useCallback((newValues: Partial<ConfigData>) => {
    setConfig(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  // Cargar la configuración automáticamente si se solicita
  useEffect(() => {
    if (autoLoad) {
      loadConfig();
    }
  }, [autoLoad, loadConfig]);

  return {
    config,
    setConfig,
    updateConfig,
    loadConfig,
    saveConfig,
    isLoading,
    isSaving,
    error
  };
};

export default useConfig;