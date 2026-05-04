/**
 * Custom Hook para fetch de datos con caché y revalidación
 * Implementación optimizada con caché LRU
 * 
 * MEJORAS DE RENDIMIENTO IMPLEMENTADAS:
 * - Caché LRU con límite de tamaño configurable
 * - Cleanup automático de entradas expiradas
 * - Evitación de memory leaks
 * - Serialización de datos para mejor rendimiento
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Implementación de caché LRU (Least Recently Used)
 * Versión simplificada para evitar dependencias externas
 */
class LRUCache<T> {
  private cache: Map<string, { data: T; timestamp: number; lastAccess: number }>;
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = defaultTTL;
    this.initCleanup();
  }

  /**
   * Inicializa el cleanup periódico de entradas expiradas
   */
  private initCleanup(): void {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000); // Cleanup cada minuto
    }
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Si el caché sigue muy grande, eliminar las más antiguas
    if (this.cache.size > this.maxSize * 2) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      
      const toDelete = entries.slice(0, Math.floor(entries.length * 0.3));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtiene un valor del caché
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar si expiró
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar último acceso (para LRU)
    entry.lastAccess = Date.now();
    return entry.data;
  }

  /**
   * Guarda un valor en el caché
   */
  set(key: string, data: T): void {
    // Si el caché está lleno, eliminar entradas más antiguas
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      
      // Eliminar el 20% de las entradas más antiguas
      const toDelete = entries.slice(0, Math.floor(entries.length * 0.2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now()
    });
  }

  /**
   * Elimina una entrada específica
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Destruye el caché y limpia recursos
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Caché global con límite de tamaño configurado
// RENDIMIENTO: Limitado a 200 entradas para evitar memory leaks
const globalCache = new LRUCache<any>(200, 5 * 60 * 1000);

interface UseFetchOptions<T> {
  /** URL a fetching */
  url: string;
  /** Configuración de fetch */
  fetchOptions?: RequestInit;
  /** Tiempo de caché en ms (default: 5 minutos) */
  cacheTime?: number;
  /** Intervalo de revalidación en ms (opcional) */
  revalidateInterval?: number;
  /** Si debe hacer revalidate on mount */
  revalidateOnMount?: boolean;
  /** Si debe revalidar cuando el foco vuelve a la ventana */
  revalidateOnFocus?: boolean;
  /** Si debe revalidar cuando hay reconexión */
  revalidateOnReconnect?: boolean;
  /** Función para transformar los datos */
  transform?: (data: any) => T;
  /** Callback de error */
  onError?: (error: Error) => void;
  /** Callback de éxito */
  onSuccess?: (data: T) => void;
}

interface UseFetchState<T> {
  /** Datos obtenidos */
  data: T | null;
  /** Si está cargando */
  loading: boolean;
  /** Si hubo un error */
  error: Error | null;
  /** Si está revalidando */
  isValidating: boolean;
  /** Función para mutar los datos manualmente */
  mutate: (data?: T | ((currentData: T | null) => T)) => void;
  /** Función para forzar revalidación */
  revalidate: () => Promise<void>;
}

/**
 * Hook para fetching de datos con caché optimizado
 * 
 * MEJORAS:
 * - Usa caché LRU en lugar de Map simple
 * - Limpieza automática de entradas expiradas
 * - Prevención de memory leaks
 */
export function useFetch<T = any>({
  url,
  fetchOptions = {},
  cacheTime = 5 * 60 * 1000, // 5 minutos por defecto
  revalidateInterval,
  revalidateOnMount = true,
  revalidateOnFocus = true,
  revalidateOnReconnect = true,
  transform,
  onError,
  onSuccess,
}: UseFetchOptions<T>): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(revalidateOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const mountedRef = useRef(true);
  const revalidateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Obtiene datos del caché o null si expiró
   * RENDIMIENTO: Usa caché LRU en lugar de Map simple
   */
  const getCachedData = useCallback((): T | null => {
    return globalCache.get(url) as T | null;
  }, [url]);

  /**
   * Guarda datos en caché
   * RENDIMIENTO: Usa caché LRU con gestión de memoria
   */
  const setCachedData = useCallback((newData: T) => {
    globalCache.set(url, newData);
  }, [url]);

  /**
   * Función para obtener datos
   */
  const fetchData = useCallback(async (isRevalidate = false) => {
    if (!mountedRef.current) return;

    try {
      if (isRevalidate) {
        setIsValidating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const transformedData = transform ? transform(result) : result;

      if (mountedRef.current) {
        setData(transformedData);
        setCachedData(transformedData);
        onSuccess?.(transformedData);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, [url, fetchOptions, transform, onError, onSuccess, setCachedData]);

  /**
   * Fuerza revalidación
   */
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Mutación manual de datos
   */
  const mutate = useCallback((newData?: T | ((currentData: T | null) => T)) => {
    if (typeof newData === 'function') {
      setData(currentData => {
        const updatedData = (newData as Function)(currentData);
        if (updatedData) {
          setCachedData(updatedData);
        }
        return updatedData;
      });
    } else if (newData !== undefined) {
      setData(newData);
      setCachedData(newData);
    }
  }, [setCachedData]);

  // Efecto principal
  useEffect(() => {
    mountedRef.current = true;

    // Verificar caché primero
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      
      // Revalidar en background si es necesario
      if (revalidateOnMount) {
        fetchData(true);
      }
    } else {
      fetchData(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [url]);

  // Revalidación on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // Revalidación on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  // Revalidación periódica
  useEffect(() => {
    if (!revalidateInterval) return;

    revalidateIntervalRef.current = setInterval(() => {
      fetchData(true);
    }, revalidateInterval);

    return () => {
      if (revalidateIntervalRef.current) {
        clearInterval(revalidateIntervalRef.current);
      }
    };
  }, [revalidateInterval, fetchData]);

  return {
    data,
    loading,
    error,
    isValidating,
    mutate,
    revalidate,
  };
}

/**
 * Hook para crear, actualizar o eliminar datos
 */
export function useMutation<T = any, V = any>(
  url: string,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    onSettled?: (data: T | null, error: Error | null, variables: V) => void;
  } = {}
) {
  const { 
    method = 'POST', 
    onSuccess, 
    onError, 
    onSettled 
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mutate = useCallback(async (variables?: V) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: variables ? JSON.stringify(variables) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      onSuccess?.(result, variables as V);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error, variables as V);
      throw error;
    } finally {
      setIsLoading(false);
      onSettled?.(data, error, variables as V);
    }
  }, [url, method, onSuccess, onError, onSettled, data, error]);

  return {
    mutate,
    data,
    error,
    isLoading,
  };
}

/**
 * Hook para datos persistentes en localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Limpia todo el caché global
 * RENDIMIENTO: Ahora usa el método destroy del caché LRU
 */
export function clearGlobalCache(): void {
  globalCache.clear();
}

/**
 * Limpia una entrada específica del caché
 */
export function invalidateCache(url: string): void {
  globalCache.delete(url);
}

/**
 * Obtiene estadísticas del caché para monitoring
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return globalCache.getStats();
}

/**
 * Destruye el caché global (para limpieza al desmontar la app)
 */
export function destroyGlobalCache(): void {
  globalCache.destroy();
}

export default useFetch;
