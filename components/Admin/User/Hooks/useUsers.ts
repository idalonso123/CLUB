import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { User } from '@/types/user';
import { fetchUsers, updateUser, FiltersType } from '@/components/Admin/User/Service/userService';
import { deleteUser } from '@/components/Admin/User/delModal';
import { toggleUserStatus } from '@/components/Admin/User/statusModal';

const useUsers = () => {
  // Estado para usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FiltersType>({
    role: '',
    status: '',
    minPoints: '',
    maxPoints: '',
    animal: [],
    property: [],
    minAge: '',
    maxAge: '',
    postalCode: '',
    sortBy: 'registrationDate', // Valor predeterminado
    sortOrder: 'desc',          // Valor predeterminado
    dateRange: {
      from: '',
      to: ''
    }
  });
  
  // Estado para modales
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToUpdateStatus, setUserToUpdateStatus] = useState<User | null>(null);
  
  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        
        // Crear objeto URLSearchParams basado en los filtros actuales
        const searchParams = new URLSearchParams();
        
        // Agregar filtros si tienen valor
        if (filters.role) searchParams.append('role', filters.role);
        if (filters.status) searchParams.append('status', filters.status);
        if (filters.minPoints) searchParams.append('minPoints', filters.minPoints);
        if (filters.maxPoints) searchParams.append('maxPoints', filters.maxPoints);
        if (filters.dateRange?.from) searchParams.append('fromDate', filters.dateRange.from);
        if (filters.dateRange?.to) searchParams.append('toDate', filters.dateRange.to);
        
        // Agregar nuevos filtros
        if (filters.animal && filters.animal.length > 0) {
          filters.animal.forEach(animal => {
            searchParams.append('animal', animal);
          });
        }
        if (filters.property && filters.property.length > 0) {
          filters.property.forEach(property => {
            searchParams.append('property', property);
          });
        }
        if (filters.minAge) searchParams.append('minAge', filters.minAge);
        if (filters.maxAge) searchParams.append('maxAge', filters.maxAge);
        if (filters.postalCode) searchParams.append('postalCode', filters.postalCode);
        
        // Configurar ordenación
        searchParams.append('sortBy', filters.sortBy);
        searchParams.append('sortOrder', filters.sortOrder);
        
        const data = await fetchUsers(searchParams);
        setUsers(data);
        
        // Aplicar cualquier filtro adicional de texto aquí
        if (searchTerm) {
          const filtered = filterUsersByText(data, searchTerm);
          setFilteredUsers(filtered);
        } else {
          setFilteredUsers(data);
        }
      } catch (err) {
        setError(`Error al cargar usuarios: ${(err as Error).message}`);
        console.error('Error al cargar usuarios:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, [filters]); // Dependencia en filters para recargar cuando cambien
  
  // Función interna para filtrar usuarios por texto
  const filterUsersByText = useCallback((userList: User[], text: string) => {
    if (!text) return userList;
    
    const lowercasedTerm = text.toLowerCase().trim();
    
    return userList.filter(user => {
      // Búsqueda por ID (primero comprobamos ID exacto si es un número)
      if (!isNaN(Number(lowercasedTerm)) && user.id !== undefined) {
        // Convertimos ambos a string para comparación
        const userId = String(user.id);
        if (userId === lowercasedTerm) {
          return true;
        }
      }
      
      // Búsquedas por otros campos
      return (
        // Búsqueda por nombre
        (user.firstName && user.firstName.toLowerCase().includes(lowercasedTerm)) ||
        // Búsqueda por apellido
        (user.lastName && user.lastName.toLowerCase().includes(lowercasedTerm)) ||
        // Búsqueda por email
        (user.email && user.email.toLowerCase().includes(lowercasedTerm)) ||
        // Búsqueda por ID como substring
        (user.id !== undefined && String(user.id).includes(lowercasedTerm))
      );
    });
  }, []);
  
  // Función interna para aplicar filtros avanzados
  const applyAdvancedFilters = useCallback((userList: User[], filterSettings: FiltersType) => {
    let result = [...userList];
    
    // Filtrar por rol
    if (filterSettings.role) {
      result = result.filter(user => 
        user.role && user.role.toLowerCase() === filterSettings.role.toLowerCase()
      );
    }
    
    // Filtrar por estado (habilitado/deshabilitado)
    if (filterSettings.status !== '') {
      const status = filterSettings.status === 'enabled';
      result = result.filter(user => 
        user.enabled === status
      );
    }
    
    // Filtrar por puntos mínimos
    if (filterSettings.minPoints) {
      const minPoints = parseInt(filterSettings.minPoints, 10);
      if (!isNaN(minPoints)) {
        result = result.filter(user => 
          (user.points || 0) >= minPoints
        );
      }
    }
    
    // Filtrar por puntos máximos
    if (filterSettings.maxPoints) {
      const maxPoints = parseInt(filterSettings.maxPoints, 10);
      if (!isNaN(maxPoints)) {
        result = result.filter(user => 
          (user.points || 0) <= maxPoints
        );
      }
    }
    
    // Filtrar por rango de fechas
    if (filterSettings.dateRange && filterSettings.dateRange.from && filterSettings.dateRange.to) {
      const fromDate = new Date(filterSettings.dateRange.from);
      const toDate = new Date(filterSettings.dateRange.to);
      toDate.setHours(23, 59, 59); // Incluir todo el último día
      
      result = result.filter(user => {
        if (!user.registrationDate) return false;
        
        // Asegurar que registrationDate sea válida
        try {
          const regDate = new Date(user.registrationDate);
          // Verificar si es una fecha válida
          return !isNaN(regDate.getTime()) && regDate >= fromDate && regDate <= toDate;
        } catch {
          return false;
        }
      });
    }
    
    return result;
  }, []);
  
  // Aplicar filtros (esta función ahora usa las funciones internas)
  const applyFilters = useCallback(() => {
    // Como useEffect ya maneja la recarga con los filtros, 
    // aquí podemos hacer cualquier procesamiento adicional necesario
    
    let result = [...users];
    
    // Aplicar filtro de texto si existe
    if (searchTerm) {
      result = filterUsersByText(result, searchTerm);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, filterUsersByText]);

  // Función auxiliar para ordenar usuarios
  const sortUsers = (userList: User[], sortBy: string, sortOrder: string) => {
    return [...userList].sort((a, b) => {
      let comparison = 0;
      
      // Determinar qué campos comparar
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
      
      // Invertir el orden si es descendente
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  // Búsqueda simple (ahora recibe directamente una cadena de texto)
  const handleSearch = useCallback((term: string) => {
    // Asegurarse de que term sea una cadena de texto (defensa extra)
    const searchString = term || '';
    
    setSearchTerm(searchString);
    
    if (!searchString.trim()) {
      // Si la búsqueda está vacía, mostrar todos los usuarios (con filtros aplicados)
      setFilteredUsers(users);
      return;
    }
    
    // Aplicar filtro de texto
    const result = filterUsersByText(users, searchString);
    setFilteredUsers(result);
  }, [users, filterUsersByText]);
  
  // Restablecer filtros
  const resetFilters = useCallback(() => {
    const defaultFilters: FiltersType = {
      role: '',
      status: '',
      minPoints: '',
      maxPoints: '',
      animal: [],
      property: [],
      minAge: '',
      maxAge: '',
      postalCode: '',
      sortBy: 'registrationDate',
      sortOrder: 'desc',
      dateRange: {
        from: '',
        to: ''
      }
    };
    
    setFilters(defaultFilters);
    setSearchTerm('');
    
    // No es necesario establecer explícitamente filteredUsers = users
    // ya que el useEffect reaccionará al cambio en filters
  }, []);
  
  // Guardar usuario (edición)
  const handleSaveUser = useCallback(async (updatedUser: User) => {
    try {
      setIsLoading(true);
      const savedUser = await updateUser(updatedUser);
      
      setUsers(prev => prev.map(u => 
        u.id === savedUser.id ? savedUser : u
      ));
      
      setFilteredUsers(prev => prev.map(u => 
        u.id === savedUser.id ? savedUser : u
      ));
      
      toast.success("Usuario actualizado correctamente");
      setIsEditModalOpen(false);
      
      // Si el usuario estaba seleccionado, actualizar también ese estado
      if (selectedUser?.id === savedUser.id) {
        setSelectedUser(savedUser);
      }
      
    } catch (error) {
      toast.error(`Error al guardar usuario: ${(error as Error).message}`);
      console.error('Error al guardar usuario:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser]);
  
  // Guardar puntos
  const handleSavePoints = useCallback(async (user: User, pointsData: any) => {
    try {
      setIsLoading(true);
      
      const updatedUser = {
        ...user,
        points: pointsData.newPoints || (pointsData.currentPoints + pointsData.adjustment)
      };
      
      // Llamada a la API para guardar los cambios
      const response = await fetch(`/api/admin/users/${user.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustment: pointsData.adjustment,
          reason: pointsData.reason,
          type: pointsData.type
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar puntos');
      }
      
      // Actualizar usuarios en el estado
      setUsers(prev => prev.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
      setFilteredUsers(prev => prev.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
      // Si el usuario estaba seleccionado, actualizar también ese estado
      if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUser);
      }
      
      toast.success('Puntos actualizados correctamente');
      setIsPointsModalOpen(false);
      
    } catch (error) {
      toast.error(`Error al actualizar puntos: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, setUsers, setFilteredUsers, setSelectedUser, setIsPointsModalOpen]);
  
  // Confirmación de eliminación de usuario
  const confirmDeleteUser = useCallback(async (user: User) => {
    try {
      setIsLoading(true);
      // Llamar a la API para eliminar al usuario
      await deleteUser(Number(user.id));
      
      // Eliminar al usuario de la lista
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      setFilteredUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      
      toast.success(`Usuario eliminado correctamente`);
      
      // Si era el usuario seleccionado, limpiar ese estado también
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setIsModalOpen(false);
      }
      
    } catch (error) {
      toast.error(`Error al eliminar al usuario: ${(error as Error).message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setIsLoading(false);
    }
  }, [selectedUser]);
  
  // Cambiar estado de usuario (activar/desactivar)
  const handleToggleUserStatus = useCallback(async (user: User) => {
    try {
      setIsLoading(true);
      // Llamar a la API para cambiar el estado
      const newStatusData = await toggleUserStatus(Number(user.id));
      
      // Actualizar usuario con ambas propiedades (status y enabled)
      const updatedUser = {
        ...user,
        status: newStatusData.status,
        enabled: newStatusData.enabled
      };
      
      // Actualizar la lista de usuarios
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
      setFilteredUsers(prevUsers => prevUsers.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
      // Si era el usuario seleccionado, actualizar ese estado también
      if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUser);
      }
      
      toast.success(`Usuario ${newStatusData.enabled ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      toast.error(`Error al cambiar el estado: ${(error as Error).message}`);
    } finally {
      setIsStatusModalOpen(false);
      setUserToUpdateStatus(null);
      setIsLoading(false);
    }
  }, [selectedUser]);

  return {
    users,
    setUsers,
    filteredUsers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    handleSearch,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    
    // Acciones
    handleSaveUser,
    handleSavePoints,
    confirmDeleteUser,
    handleToggleUserStatus,
    
    // Estados de modales
    selectedUser,
    setSelectedUser,
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isPointsModalOpen,
    setIsPointsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isStatusModalOpen, 
    setIsStatusModalOpen,
    userToDelete,
    setUserToDelete,
    userToUpdateStatus,
    setUserToUpdateStatus
  };
};

export default useUsers;