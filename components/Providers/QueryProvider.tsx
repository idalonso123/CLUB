/**
 * Proveedor de React Query para la aplicación
 * 
 * Este componente envuelve toda la aplicación y proporciona
 * el contexto de React Query con configuración optimizada.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Configuración del cliente de consultas
 * 
 * Opciones configuradas:
 * - defaultOptions: Opciones por defecto para todas las consultas
 *   - staleTime: Tiempo que los datos se consideran frescos (5 minutos)
 *   - gcTime: Tiempo que los datos permanecen en caché (10 minutos)
 *   - retry: Número de reintentos en caso de error (3)
 *   - refetchOnWindowFocus: Revalidar cuando la ventana recupera el foco
 */
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
      retry: 3,
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Crear el QueryClient en un estado para evitar problemas con HMR
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { createQueryClient };
