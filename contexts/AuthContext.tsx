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
      
      // Redirigir según rol de usuario
      switch (data.user.role) {
        case 'administrador':
        case 'admin':
          router.push('/admin');
          break;
        case 'cajero':
        case 'teller':
          router.push('/teller');
          break;
        case 'marketing':
          router.push('/marketing');
          break;
        default:
          router.push('/puntos-fidelidad');
          break;
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

  // Efecto para cerrar sesión automáticamente al cerrar o abandonar la aplicación
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Limpiar almacenamiento local al cerrar/abandonar la aplicación
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    };

    // Parabeforeunload: cuando se cierra el navegador o la pestaña
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Paravisibilitychange: cuando se cambia de pestaña o se oculta la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Solo cerrar sesión si estaba logueado
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          // Llamar al endpoint de logout en segundo plano
          navigator.sendBeacon('/api/auth/logout', JSON.stringify({}));
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

// Componente para detectar cierre/abandono de la aplicación
export function SessionManager({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Detectar cuando el usuario cierra el navegador o la pestaña
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAuthenticated) {
        // Limpiar sesión antes de cerrar
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Llamar al endpoint de logout
        const data = JSON.stringify({ type: 'unload' });
        navigator.sendBeacon('/api/auth/logout', data);
      }
    };

    // Detectar cuando el usuario cambia de pestaña o minimiza
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isAuthenticated) {
        // Limpiar sesión
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Llamar al endpoint de logout en segundo plano
        const data = JSON.stringify({ type: 'visibility' });
        navigator.sendBeacon('/api/auth/logout', data);
      }
    };

    // Detectar desconexión de red
    const handleOffline = () => {
      if (isAuthenticated) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}