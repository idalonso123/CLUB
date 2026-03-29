import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ExpirationConfig {
  caducidad_puntos_meses: number;
  caducidad_carnet_inactividad_meses: number;
  caducidad_carnet_antiguedad_meses: number;
  sellos_requeridos_carnet: number;
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

// Valores por defecto para niveles de cliente (usando letras como iconos para evitar problemas de codificacion)
const DEFAULT_CLIENT_LEVELS: ClientLevel[] = [
  { nivel: 1, nombre: 'Semilla', icono: 'S', puntosMinimos: 0, puntosMaximos: 49, eurosCompraMinima: 0, activo: true },
  { nivel: 2, nombre: 'Brote', icono: 'B', puntosMinimos: 50, puntosMaximos: 89, eurosCompraMinima: 150, activo: true },
  { nivel: 3, nombre: 'Hoja', icono: 'H', puntosMinimos: 90, puntosMaximos: 169, eurosCompraMinima: 300, activo: true },
  { nivel: 4, nombre: 'Flor', icono: 'F', puntosMinimos: 170, puntosMaximos: null, eurosCompraMinima: 500, activo: true },
];

export const useConfig = (autoLoad = false) => {
  // Estados para la configuracion y carga
  const [config, setConfig] = useState<ConfigData & { clientLevels: ClientLevel[] }>({ 
    eurosPorPunto: 3.5,
    puntosBienvenida: 5,
    tellerRewards: {
      rewardIds: [],
      showAllRewards: true
    },
    expiration: {
      caducidad_puntos_meses: 12,
      caducidad_carnet_inactividad_meses: 6,
      caducidad_carnet_antiguedad_meses: 24,
      sellos_requeridos_carnet: 6
    },
    clientLevels: DEFAULT_CLIENT_LEVELS
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funcion para cargar la configuracion
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/config');
      
      if (!response.ok) {
        throw new Error('Error al cargar la configuracion');
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
            caducidad_carnet_antiguedad_meses: 24,
            sellos_requeridos_carnet: 6
          },
          clientLevels: data.config?.clientLevels && data.config.clientLevels.length > 0
            ? data.config.clientLevels
            : DEFAULT_CLIENT_LEVELS
        });
      } else {
        throw new Error(data.message || 'Error al cargar la configuracion');
      }
    } catch (error) {
      console.error('Error al cargar la configuracion:', error);
      setError((error as Error).message);
      toast.error('No se pudo cargar la configuracion');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Funcion para guardar la configuracion
  const saveConfig = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Validar que eurosPorPunto no sea cero o negativo
      if (config.eurosPorPunto <= 0) {
        throw new Error('El valor debe ser mayor que cero');
      }
      
      // Asegurarse de que eurosPorPunto sea un numero
      const eurosPorPuntoValue = Number(config.eurosPorPunto);
      if (isNaN(eurosPorPuntoValue)) {
        throw new Error('El valor debe ser un numero valido');
      }
      
      const puntosBienvenidaValue = Number(config.puntosBienvenida);
      if (isNaN(puntosBienvenidaValue) || puntosBienvenidaValue < 0 || !Number.isInteger(puntosBienvenidaValue)) {
        throw new Error('Los puntos de bienvenida deben ser un numero entero positivo');
      }
      
      // Validar configuraciones de caducidad
      const { expiration, clientLevels } = config;
      if (
        !Number.isInteger(expiration.caducidad_puntos_meses) || expiration.caducidad_puntos_meses < 1 ||
        !Number.isInteger(expiration.caducidad_carnet_inactividad_meses) || expiration.caducidad_carnet_inactividad_meses < 1 ||
        !Number.isInteger(expiration.caducidad_carnet_antiguedad_meses) || expiration.caducidad_carnet_antiguedad_meses < 1 ||
        !Number.isInteger(expiration.sellos_requeridos_carnet) || expiration.sellos_requeridos_carnet < 1 || expiration.sellos_requeridos_carnet > 20
      ) {
        throw new Error('Las configuraciones de caducidad deben ser numeros enteros positivos, y los sellos requeridos deben estar entre 1 y 20');
      }
      
      // Validar niveles de cliente
      if (!clientLevels || clientLevels.length !== 4) {
        throw new Error('Debe haber exactamente 4 niveles de cliente');
      }
      
      for (let i = 0; i < clientLevels.length; i++) {
        const level = clientLevels[i];
        
        if (
          typeof level.puntosMinimos !== 'number' ||
          !Number.isInteger(level.puntosMinimos) ||
          level.puntosMinimos < 0 ||
          (level.puntosMaximos !== null && (!Number.isInteger(level.puntosMaximos) || level.puntosMaximos < level.puntosMinimos)) ||
          typeof level.eurosCompraMinima !== 'number' ||
          level.eurosCompraMinima < 0
        ) {
          throw new Error(`Datos invalidos para el nivel ${i + 1}`);
        }

        // Validar que no se solapen los niveles
        if (i > 0) {
          const prevLevel = clientLevels[i - 1];
          if (level.puntosMinimos <= (prevLevel.puntosMaximos || prevLevel.puntosMinimos)) {
            throw new Error(`El nivel ${i + 1} no puede tener puntos minimos menores o iguales al maximo del nivel anterior`);
          }
        }

        // Validar que los euros de compra minima sean crecientes
        if (i > 0) {
          const prevLevel = clientLevels[i - 1];
          if (level.eurosCompraMinima < prevLevel.eurosCompraMinima) {
            throw new Error(`El nivel ${i + 1} debe tener una compra minima mayor o igual que el nivel anterior`);
          }
        }
      }
      
      console.log('Enviando configuracion:', { 
        eurosPorPunto: eurosPorPuntoValue,
        puntosBienvenida: puntosBienvenidaValue,
        tellerRewards: config.tellerRewards,
        expiration: config.expiration,
        clientLevels: config.clientLevels
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
          expiration: config.expiration,
          clientLevels: config.clientLevels
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Configuracion guardada correctamente');
        return true;
      } else {
        throw new Error(data.message || 'Error al guardar la configuracion');
      }
    } catch (error) {
      console.error('Error al guardar la configuracion:', error);
      setError((error as Error).message);
      toast.error((error as Error).message || 'No se pudo guardar la configuracion');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  // Funcion para actualizar la configuracion
  const updateConfig = useCallback((newValues: Partial<ConfigData & { clientLevels: ClientLevel[] }>) => {
    setConfig(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  // Funcion para actualizar un Nivel especifico
  const updateClientLevel = useCallback((nivel: number, updates: Partial<ClientLevel>) => {
    setConfig(prev => ({
      ...prev,
      clientLevels: prev.clientLevels.map(level => 
        level.nivel === nivel ? { ...level, ...updates } : level
      )
    }));
  }, []);

  // Cargar la configuracion automaticamente si se solicita
  useEffect(() => {
    if (autoLoad) {
      loadConfig();
    }
  }, [autoLoad, loadConfig]);

  return {
    config,
    setConfig,
    updateConfig,
    updateClientLevel,
    loadConfig,
    saveConfig,
    isLoading,
    isSaving,
    error
  };
};

export default useConfig;
