import React, { createContext, useState, useEffect, useContext, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';

/**
 * Interfaz de usuario actualizada para incluir enabled
 */
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photoUrl?: string;
  enabled: boolean;
}

/**
 * Tipos de errores de autenticación
 */
type AuthErrorType = 'email_not_verified' | 'account_disabled' | 'generic';

/**
 * Resultado de login con información de error
 */
interface LoginResult {
  success: boolean;
  error?: {
    type: AuthErrorType;
    message: string;
  };
}

/**
 * Tipo del contexto de autenticación
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * Claves de almacenamiento para sesión
 */
const STORAGE_KEYS = {
  USER: 'user',
  SESSION: 'session'
} as const;

/**
 * Contexto de autenticación
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Función auxiliar para limpiar el almacenamiento de sesión
 */
function clearSessionStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (error) {
    console.error('Error al limpiar almacenamiento:', error);
  }
}

/**
 * Función auxiliar para obtener el usuario almacenado
 */
function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const localUser = localStorage.getItem(STORAGE_KEYS.USER);
    const sessionUser = sessionStorage.getItem(STORAGE_KEYS.USER);
    const storedUser = localUser || sessionUser;
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      return parsedUser.enabled !== false ? parsedUser : null;
    }
  } catch (error) {
    console.error('Error al obtener usuario almacenado:', error);
    clearSessionStorage();
  }
  return null;
}

/**
 * Proveedor de autenticación
 * Gestiona el estado de sesión, login, logout y limpieza de eventos
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Ref para evitar múltiples limpiezas
  const cleanupRef = useRef(false);
  
  // Ref para almacenar el estado de autenticación actual
  const isAuthenticatedRef = useRef(false);

  // Sincronizar ref con estado
  useEffect(() => {
    isAuthenticatedRef.current = !!user;
  }, [user]);

  // Efecto para cargar usuario inicial desde storage
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Función de logout optimizada con useCallback
  const logout = useCallback(async () => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;
    
    try {
      // Llamar al endpoint de logout para limpiar la cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        keepalive: true
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearSessionStorage();
      setUser(null);
      cleanupRef.current = false;
      
      // Verificar si estamos en el cliente antes de redirigir
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
    }
  }, [router]);

  // Efecto para gestionar eventos de limpieza de sesión
  useEffect(() => {
    // Flag para evitar limpiezas múltiples
    let isCleaning = false;
    
    // Función para limpiar sesión de forma segura
    const safeCleanup = async () => {
      if (isCleaning || cleanupRef.current) return;
      isCleaning = true;
      
      try {
        // Usar sendBeacon para solicitud confiable en unload
        const data = JSON.stringify({ type: 'cleanup', timestamp: Date.now() });
        navigator.sendBeacon('/api/auth/logout', data);
      } catch (error) {
        console.error('Error en cleanup:', error);
      } finally {
        clearSessionStorage();
        isCleaning = false;
      }
    };

    // Manejador para beforeunload (cierre de pestaña/navegador)
    const handleBeforeUnload = () => {
      if (isAuthenticatedRef.current) {
        safeCleanup();
      }
    };

    // Manejador para visibilitychange (cambio de pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isAuthenticatedRef.current) {
        safeCleanup();
      }
    };

    // Manejador para desconexión de red
    const handleOffline = () => {
      if (isAuthenticatedRef.current) {
        clearSessionStorage();
      }
    };

    // Registrar eventos
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);

    // Función de limpieza del efecto
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función de login
  const login = useCallback(async (
    email: string, 
    password: string, 
    remember: boolean
  ): Promise<LoginResult> => {
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
      
      if (!response.ok) {
        if (data.emailNotVerified) {
          return { 
            success: false, 
            error: { 
              type: 'email_not_verified', 
              message: data.message || 'Por favor verifica tu email antes de iniciar sesión.' 
            } 
          };
        } else if (data.accountDisabled) {
          return { 
            success: false, 
            error: { 
              type: 'account_disabled', 
              message: data.message || 'La cuenta se encuentra desactivada.' 
            } 
          };
        } else {
          return { 
            success: false, 
            error: { 
              type: 'generic', 
              message: data.message || 'Error en la autenticación' 
            } 
          };
        }
      }
      
      // Guardar usuario según preferencia
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      } else {
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      }
      
      setUser(data.user);
      
      // Redirigir según rol de usuario
      const roleRedirects: Record<string, string> = {
        'administrador': '/admin',
        'admin': '/admin',
        'cajero': '/teller',
        'teller': '/teller',
        'marketing': '/marketing'
      };
      const redirectPath = roleRedirects[data.user.role] || '/puntos-fidelidad';
      
      router.push(redirectPath);
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: { 
          type: 'generic', 
          message: 'Error de conexión. Por favor intenta de nuevo.' 
        } 
      };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para usar el contexto de autenticación
 * @throws Error si se usa fuera de AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}