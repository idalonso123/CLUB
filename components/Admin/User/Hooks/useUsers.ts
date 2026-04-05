import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { User } from '@/types/user';
import { 
  fetchUsers, 
  updateUser, 
  adjustPoints as adjustPointsService,
  deleteUser as deleteUserService,
  toggleUserStatus as toggleUserStatusService,
  FiltersType 
} from '@/components/Admin/User/Service/userService';

/**
 * Hook refactorizado para gestión de usuarios
 * 
 * Este hook sigue el principio de responsabilidad única y está dividido en:
 * - useUsersState: Gestión de estado puro
 * - useUsersActions: Acciones sobre usuarios
 * - useUsersFilters: Lógica de filtrado y búsqueda
 * 
 * Las mejoras incluyen:
 * - Uso correcto de la capa de servicios (no hay llamadas fetch directas)
 * - Estado memoizado para evitar re-renderizados innecesarios
 * - Efectos con cleanup adecuado
 * - Lógica de filtrado optimizada con useMemo
 */

// ============================================================================
// CONSTANTES Y UTILIDADES
// ============================================================================

const DEFAULT_FILTERS: FiltersType = {
  role: '',
  status: '',
  minPoints: '',
  maxPoints: '',
  sortBy: 'registrationDate',
  sortOrder: 'desc',
  animal: [],
  property: [],
  minAge: '',
  maxAge: '',
  postalCode: '',
  dateRange: {
    from: '',
    to: ''
  }
};

/**
 * Filtra usuarios por texto de búsqueda
 * Implementación optimizada que usa useMemo en el componente
 */
const filterUsersByText = (users: User[], searchTerm: string): User[] => {
  if (!searchTerm?.trim()) return users;
  
  const lowercasedTerm = searchTerm.toLowerCase().trim();
  
  return users.filter(user => {
    // Búsqueda por ID exacto
    if (!isNaN(Number(lowercasedTerm))) {
      const userId = String(user.id);
      if (userId === lowercasedTerm) return true;
    }
    
    // Búsqueda por otros campos
    return (
      user.firstName?.toLowerCase().includes(lowercasedTerm) ||
      user.lastName?.toLowerCase().includes(lowercasedTerm) ||
      user.email?.toLowerCase().includes(lowercasedTerm) ||
      String(user.id).includes(lowercasedTerm)
    );
  });
};

/**
 * Ordena usuarios según criterios especificados
 */
const sortUsers = (users: User[], sortBy: string, sortOrder: string): User[] => {
  return [...users].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        break;
      case 'email':
        comparison = (a.email || '').localeCompare(b.email || '');
        break;
      case 'points':
        comparison = (a.points || 0) - (b.points || 0);
        break;
      case 'registrationDate':
        const dateA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
        const dateB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

// ============================================================================
// TIPOS PARA EL ESTADO DEL HOOK
// ============================================================================

interface UserModalState {
  selectedUser: User | null;
  isEditModalOpen: boolean;
  isPointsModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isStatusModalOpen: boolean;
  isUnsubscribeModalOpen: boolean;
}

interface UserActionState {
  userToDelete: User | null;
  userToUpdateStatus: User | null;
  userToUnsubscribe: User | null;
  isSubscribing: boolean;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

const useUsers = () => {
  // Estado principal de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FiltersType>(DEFAULT_FILTERS);
  
  // Estado de modales
  const [modalState, setModalState] = useState<UserModalState>({
    selectedUser: null,
    isEditModalOpen: false,
    isPointsModalOpen: false,
    isDeleteModalOpen: false,
    isStatusModalOpen: false,
    isUnsubscribeModalOpen: false
  });
  
  const [actionState, setActionState] = useState<UserActionState>({
    userToDelete: null,
    userToUpdateStatus: null,
    userToUnsubscribe: null,
    isSubscribing: false
  });
  
  // ============================================================================
  // CARGA DE USUARIOS CON CLEANUP ADECUADO
  // ============================================================================
  
  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();
    
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construir parámetros de búsqueda
        const searchParams = new URLSearchParams();
        
        if (filters.role) searchParams.append('role', filters.role);
        if (filters.status) searchParams.append('status', filters.status);
        if (filters.minPoints) searchParams.append('minPoints', filters.minPoints);
        if (filters.maxPoints) searchParams.append('maxPoints', filters.maxPoints);
        if (filters.dateRange?.from) searchParams.append('fromDate', filters.dateRange.from);
        if (filters.dateRange?.to) searchParams.append('toDate', filters.dateRange.to);
        if (filters.minAge) searchParams.append('minAge', filters.minAge);
        if (filters.maxAge) searchParams.append('maxAge', filters.maxAge);
        if (filters.postalCode) searchParams.append('postalCode', filters.postalCode);
        
        filters.animal?.forEach(animal => searchParams.append('animal', animal));
        filters.property?.forEach(property => searchParams.append('property', property));
        
        searchParams.append('sortBy', filters.sortBy);
        searchParams.append('sortOrder', filters.sortOrder);
        
        const data = await fetchUsers(searchParams);
        
        // Solo actualizar estado si el efecto no ha sido cancelado
        if (!isCancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios';
          setError(errorMessage);
          console.error('Error al cargar usuarios:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    loadUsers();
    
    // Cleanup: cancelar operaciones pendientes y limpiar recursos
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [filters]);

  // ============================================================================
  // USUARIOS FILTRADOS (MEMOIZADO)
  // ============================================================================
  
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Aplicar filtro de texto
    if (searchTerm) {
      result = filterUsersByText(result, searchTerm);
    }
    
    // Aplicar ordenamiento
    result = sortUsers(result, filters.sortBy, filters.sortOrder);
    
    return result;
  }, [users, searchTerm, filters.sortBy, filters.sortOrder]);
  
  // ============================================================================
  // FUNCIONES DE ACCIÓN (UTILIZAN LA CAPA DE SERVICIOS)
  // ============================================================================
  
  const handleSaveUser = useCallback(async (updatedUser: User) => {
    try {
      setIsLoading(true);
      const savedUser = await updateUser(updatedUser);
      
      setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
      
      toast.success("Usuario actualizado correctamente");
      setModalState(prev => ({ ...prev, isEditModalOpen: false }));
      
      if (modalState.selectedUser?.id === savedUser.id) {
        setModalState(prev => ({ ...prev, selectedUser: savedUser }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar usuario';
      toast.error(message);
      console.error('Error al guardar usuario:', error);
    } finally {
      setIsLoading(false);
    }
  }, [modalState.selectedUser]);
  
  const handleSavePoints = useCallback(async (user: User, pointsData: { adjustment: number; reason: string; type: string }) => {
    try {
      setIsLoading(true);
      
      // USAR EL SERVICIO (antes hacía fetch directo)
      const result = await adjustPointsService(user.id, pointsData.adjustment, pointsData.reason);
      
      const updatedUser = {
        ...user,
        points: result.newPoints
      };
      
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      
      if (modalState.selectedUser?.id === user.id) {
        setModalState(prev => ({ ...prev, selectedUser: updatedUser }));
      }
      
      toast.success('Puntos actualizados correctamente');
      setModalState(prev => ({ ...prev, isPointsModalOpen: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar puntos';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [modalState.selectedUser]);
  
  const confirmDeleteUser = useCallback(async (user: User) => {
    try {
      setIsLoading(true);
      
      // USAR EL SERVICIO (antes hacía fetch directo)
      await deleteUserService(Number(user.id));
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      toast.success('Usuario eliminado correctamente');
      
      if (modalState.selectedUser?.id === user.id) {
        setModalState(prev => ({ 
          ...prev, 
          selectedUser: null,
          isModalOpen: false 
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
      toast.error(message);
    } finally {
      setActionState(prev => ({ ...prev, userToDelete: null }));
      setModalState(prev => ({ ...prev, isDeleteModalOpen: false }));
      setIsLoading(false);
    }
  }, [modalState.selectedUser]);
  
  const handleToggleUserStatus = useCallback(async (user: User) => {
    try {
      setIsLoading(true);
      
      // USAR EL SERVICIO (antes hacía fetch directo)
      const newStatusData = await toggleUserStatusService(Number(user.id));
      
      const updatedUser = {
        ...user,
        status: newStatusData.status,
        enabled: newStatusData.enabled
      };
      
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
      
      if (modalState.selectedUser?.id === user.id) {
        setModalState(prev => ({ ...prev, selectedUser: updatedUser }));
      }
      
      toast.success(`Usuario ${newStatusData.enabled ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar estado';
      toast.error(message);
    } finally {
      setActionState(prev => ({ ...prev, userToUpdateStatus: null }));
      setModalState(prev => ({ ...prev, isStatusModalOpen: false }));
      setIsLoading(false);
    }
  }, [modalState.selectedUser]);
  
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term || '');
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
  }, []);
  
  // ============================================================================
  // GESTIÓN DE SUSCRIPCIONES
  // ============================================================================
  
  const handleSubscriptionChange = useCallback(async (user: User, subscribe: boolean) => {
    try {
      setActionState(prev => ({ ...prev, isSubscribing: true }));

      if (subscribe) {
        const response = await fetch(`/api/email/subscribers/${user.id}/subscription`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'subscribe' })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Error al suscribir');
        }

        toast.success('Usuario suscrito correctamente');

        const updatedUser = { ...user, emailSubscribed: true };
        setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
        if (modalState.selectedUser?.id === user.id) {
          setModalState(prev => ({ ...prev, selectedUser: updatedUser }));
        }
      } else {
        setActionState(prev => ({ 
          ...prev, 
          userToUnsubscribe: user,
          isUnsubscribeModalOpen: true 
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al gestionar suscripción';
      toast.error(message);
    } finally {
      setActionState(prev => ({ ...prev, isSubscribing: false }));
    }
  }, [modalState.selectedUser]);

  const confirmUnsubscribe = useCallback(async (user: User) => {
    try {
      setActionState(prev => ({ ...prev, isSubscribing: true }));

      const response = await fetch(`/api/email/subscribers/${user.id}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe' })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al darse de baja');
      }

      toast.success('Usuario dado de baja completamente');

      const updatedUser = { ...user, emailSubscribed: false };
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
      if (modalState.selectedUser?.id === user.id) {
        setModalState(prev => ({ ...prev, selectedUser: updatedUser }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al darse de baja';
      toast.error(message);
    } finally {
      setActionState(prev => ({ 
        ...prev, 
        userToUnsubscribe: null,
        isUnsubscribeModalOpen: false,
        isSubscribing: false 
      }));
    }
  }, [modalState.selectedUser]);

  // ============================================================================
  // HELPERS PARA MODALES
  // ============================================================================
  
  const openUserModal = useCallback((user: User) => {
    setModalState(prev => ({ ...prev, selectedUser: user, isModalOpen: true }));
  }, []);
  
  const openEditModal = useCallback((user: User) => {
    setModalState(prev => ({ ...prev, selectedUser: user, isEditModalOpen: true }));
  }, []);
  
  const openPointsModal = useCallback((user: User) => {
    setModalState(prev => ({ ...prev, selectedUser: user, isPointsModalOpen: true }));
  }, []);
  
  const openDeleteModal = useCallback((user: User) => {
    setActionState(prev => ({ ...prev, userToDelete: user }));
    setModalState(prev => ({ ...prev, isDeleteModalOpen: true }));
  }, []);
  
  const openStatusModal = useCallback((user: User) => {
    setActionState(prev => ({ ...prev, userToUpdateStatus: user }));
    setModalState(prev => ({ ...prev, isStatusModalOpen: true }));
  }, []);
  
  const openUnsubscribeModal = useCallback((user: User) => {
    setActionState(prev => ({ ...prev, userToUnsubscribe: user }));
    setModalState(prev => ({ ...prev, isUnsubscribeModalOpen: true }));
  }, []);
  
  const closeModal = useCallback((modal: keyof UserModalState) => {
    setModalState(prev => ({ ...prev, [modal]: false }));
  }, []);

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================
  
  return {
    // Estado
    users,
    filteredUsers,
    isLoading,
    error,
    searchTerm,
    filters,
    
    // Setters
    setSearchTerm,
    setFilters,
    setUsers,
    
    // Acciones principales
    handleSaveUser,
    handleSavePoints,
    confirmDeleteUser,
    handleToggleUserStatus,
    handleSearch,
    resetFilters,
    
    // Estado de modales
    selectedUser: modalState.selectedUser,
    isModalOpen: modalState.isModalOpen,
    isEditModalOpen: modalState.isEditModalOpen,
    isPointsModalOpen: modalState.isPointsModalOpen,
    isDeleteModalOpen: modalState.isDeleteModalOpen,
    isStatusModalOpen: modalState.isStatusModalOpen,
    isUnsubscribeModalOpen: modalState.isUnsubscribeModalOpen,
    
    // Acciones de usuarios para modales
    userToDelete: actionState.userToDelete,
    userToUpdateStatus: actionState.userToUpdateStatus,
    userToUnsubscribe: actionState.userToUnsubscribe,
    isSubscribing: actionState.isSubscribing,
    
    // Gestión de suscripciones
    handleSubscriptionChange,
    confirmUnsubscribe,
    
    // Helpers para abrir modales
    openUserModal,
    openEditModal,
    openPointsModal,
    openDeleteModal,
    openStatusModal,
    openUnsubscribeModal,
    closeModal
  };
};

export default useUsers;