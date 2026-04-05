/**
 * Hooks de React Query para gestión de usuarios
 * 
 * Proporciona una capa de abstracción sobre las llamadas a la API
 * con caché automático, revalidación y manejo de estados.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/user';
import { 
  fetchUsers, 
  updateUser, 
  adjustPoints,
  deleteUser as deleteUserService,
  toggleUserStatus as toggleUserStatusService,
  FiltersType 
} from '@/components/Admin/User/Service/userService';
import toast from 'react-hot-toast';

// ============================================================================
// CLAVES DE CACHÉ
// ============================================================================

export const USERS_QUERY_KEY = 'users';
export const USER_QUERY_KEY = 'user';

// ============================================================================
// TIPOS
// ============================================================================

interface UseUsersOptions {
  filters?: FiltersType;
  enabled?: boolean;
}

interface UseUserOptions {
  userId: number | string;
  enabled?: boolean;
}

interface PointsAdjustment {
  adjustment: number;
  reason: string;
}

// ============================================================================
// HOOK: OBTENER LISTA DE USUARIOS
// ============================================================================

/**
 * Hook para obtener la lista de usuarios con caché automático
 * 
 * Características:
 * - Caché los datos durante 5 minutos
 * - Revalida en segundo plano cuando la ventana recupera el foco
 * - Reintenta automáticamente hasta 3 veces en caso de error
 * - Permite invalidar manualmente con invalidateQueries
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { filters, enabled = true } = options;

  return useQuery({
    queryKey: [USERS_QUERY_KEY, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (filters?.role) searchParams.append('role', filters.role);
      if (filters?.status) searchParams.append('status', filters.status);
      if (filters?.minPoints) searchParams.append('minPoints', filters.minPoints);
      if (filters?.maxPoints) searchParams.append('maxPoints', filters.maxPoints);
      if (filters?.dateRange?.from) searchParams.append('fromDate', filters.dateRange.from);
      if (filters?.dateRange?.to) searchParams.append('toDate', filters.dateRange.to);
      if (filters?.minAge) searchParams.append('minAge', filters.minAge);
      if (filters?.maxAge) searchParams.append('maxAge', filters.maxAge);
      if (filters?.postalCode) searchParams.append('postalCode', filters.postalCode);
      
      filters?.animal?.forEach(animal => searchParams.append('animal', animal));
      filters?.property?.forEach(property => searchParams.append('property', property));
      
      if (filters?.sortBy) searchParams.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) searchParams.append('sortOrder', filters.sortOrder);
      
      const users = await fetchUsers(searchParams);
      return users;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// HOOK: OBTENER UN USUARIO ESPECÍFICO
// ============================================================================

/**
 * Hook para obtener un usuario específico por ID
 */
export function useUser(options: UseUserOptions) {
  const { userId, enabled = true } = options;

  return useQuery({
    queryKey: [USER_QUERY_KEY, userId],
    queryFn: async () => {
      // Esta función debería venir del servicio
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Error al cargar el usuario');
      }
      const data = await response.json();
      return data.user as User;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOK: ACTUALIZAR USUARIO
// ============================================================================

/**
 * Hook para actualizar un usuario existente
 * 
 * Después de la actualización exitosa:
 * - Invalida la caché de usuarios para forzar revalidación
 * - Muestra notificación de éxito
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: User) => updateUser(user),
    onSuccess: (updatedUser) => {
      // Invalidar la caché de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      
      // También invalidar el usuario específico
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, updatedUser.id] });
      
      toast.success('Usuario actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar usuario: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: AJUSTAR PUNTOS
// ============================================================================

/**
 * Hook para ajustar los puntos de un usuario
 */
export function useAdjustPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, adjustment, reason }: { 
      userId: number; 
      adjustment: number; 
      reason: string;
    }) => adjustPoints(userId, adjustment, reason),
    onSuccess: () => {
      // Invalidar la caché de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success('Puntos actualizados correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al ajustar puntos: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: ELIMINAR USUARIO
// ============================================================================

/**
 * Hook para eliminar un usuario
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => deleteUserService(userId),
    onSuccess: () => {
      // Invalidar la caché de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success('Usuario eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar usuario: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: CAMBIAR ESTADO DE USUARIO
// ============================================================================

/**
 * Hook para activar/desactivar un usuario
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => toggleUserStatusService(userId),
    onSuccess: (result) => {
      // Invalidar la caché de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success(`Usuario ${result.enabled ? 'activado' : 'desactivado'} correctamente`);
    },
    onError: (error: Error) => {
      toast.error(`Error al cambiar estado: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: GESTIÓN DE SUSCRIPCIÓN
// ============================================================================

/**
 * Hook para gestionar la suscripción de email de un usuario
 */
export function useSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: 'subscribe' | 'unsubscribe' }) => {
      const response = await fetch(`/api/email/subscribers/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || `Error al ${action === 'subscribe' ? 'suscribir' : 'desuscribir'}`);
      }
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar la caché de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      
      if (variables.action === 'subscribe') {
        toast.success('Usuario suscrito correctamente');
      } else {
        toast.success('Usuario dado de baja completamente');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al gestionar suscripción: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOK: INVALIDAR CACHÉ
// ============================================================================

/**
 * Hook para invalidar manualmente la caché de usuarios
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
  };
}
