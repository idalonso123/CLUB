import toast from 'react-hot-toast';
import { User } from '@/types/user';

export interface PointsData {
  currentPoints: number;
  adjustment: number;
  reason: string;
}

export interface FiltersType {
  role: string;
  status: string;
  minPoints: string;
  maxPoints: string;
  sortBy: string;
  sortOrder: string;
  animal: string[];
  property: string[];
  minAge: string;
  maxAge: string;
  postalCode: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

// Definir interfaz para roles y exportarla
export interface Role {
  value: string;
  label: string;
}

// Roles disponibles para los usuarios
// IMPORTANTE: Mantener sincronizado con los roles definidos en la base de datos
export const availableRoles: Role[] = [
  { value: '', label: 'Todos los roles' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'admin', label: 'Admin' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'usuario', label: 'Usuario' }
];

// Roles de administrador (tienen permisos elevados)
export const ADMIN_ROLES = ['administrador', 'admin'];

// Roles que pueden acceder al panel de cajero
export const TELLER_ROLES = ['administrador', 'admin', 'cajero'];

// Roles que pueden acceder al panel de marketing
export const MARKETING_ROLES = ['administrador', 'admin', 'marketing'];

// Funciones para interactuar con la API
export const fetchUsers = async (searchParams: URLSearchParams = new URLSearchParams()): Promise<User[]> => {
  try {
    const response = await fetch(`/api/admin/users/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.users) {
      return data.users;
    } else {
      throw new Error(data.message || 'Error al cargar los usuarios');
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    throw error;
  }
};

export const updateUser = async (user: User): Promise<User> => {
  try {
    const response = await fetch(`/api/admin/users/${user.id}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el usuario');
    }
    
    const result = await response.json();
    
    if (result.success && result.user) {
      return result.user;
    } else {
      throw new Error(result.message || 'Error al actualizar el usuario');
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

export const adjustPoints = async (userId: number, adjustment: number, reason: string): Promise<{
  previousPoints: number;
  adjustment: number;
  newPoints: number;
}> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/points`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adjustment,
        reason
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar los puntos');
    }
    
    const result = await response.json();
    
    if (result.success && result.points) {
      return result.points;
    } else {
      throw new Error(result.message || 'Error al actualizar los puntos');
    }
  } catch (error) {
    console.error('Error al ajustar puntos:', error);
    throw error;
  }
};

export const deleteUser = async (userId: number): Promise<void> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/delete`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el usuario');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar el usuario');
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

export const toggleUserStatus = async (userId: number): Promise<{ status: number, enabled: boolean }> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar el estado del usuario');
    }
    
    const result = await response.json();
    
    if (result.success) {
      return {
        status: result.status, // Valor numérico (0 o 1)
        enabled: result.enabled // Valor booleano (true o false)
      };
    } else {
      throw new Error(result.message || 'Error al cambiar el estado del usuario');
    }
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
};