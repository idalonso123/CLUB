import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Actualizar la interfaz User para incluir enabled
interface User {
  id: number;
  firstName: string; // Ajustar para que coincida con la API
  lastName: string;  // Ajustar para que coincida con la API
  email: string;
  role: string;
  photoUrl?: string; // Cambiar avatarUrl por photoUrl según tu API
  enabled: boolean;  // Añadir campo enabled
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: { type: 'email_not_verified' | 'account_disabled' | 'generic'; message: string } }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario en localStorage o sessionStorage
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verificar si el usuario tiene habilitada la cuenta
        if (parsedUser && parsedUser.enabled !== false) {
          setUser(parsedUser);
        } else {
          // Si la cuenta está deshabilitada, limpiar el almacenamiento
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error al parsear datos de usuario:', error);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, remember: boolean): Promise<{ success: boolean; error?: { type: 'email_not_verified' | 'account_disabled' | 'generic'; message: string } }> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      // Verificar si la respuesta no es exitosa
      if (!response.ok) {
        // Determinar el tipo de error
        if (data.emailNotVerified) {
          return { success: false, error: { type: 'email_not_verified', message: data.message || 'Por favor verifica tu email antes de iniciar sesión.' } };
        } else if (data.accountDisabled) {
          return { success: false, error: { type: 'account_disabled', message: data.message || 'La cuenta se encuentra desactivada.' } };
        } else {
          return { success: false, error: { type: 'generic', message: data.message || 'Error en la autenticación' } };
        }
      }
      
      // Guardar usuario según preferencia
      if (remember) {
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
      
      setUser(data.user);
      
      // Redirigir según rol
      if (data.user.role === 'administrador' || data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: { type: 'generic', message: 'Error de conexión. Por favor intenta de nuevo.' } };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout para limpiar la cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Limpiar almacenamiento local
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Actualizar estado
      setUser(null);
      
      // Redirigir a login
      router.push('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}