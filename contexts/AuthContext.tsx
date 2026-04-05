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
 * SECURITY: Solo almacenamos identificadores mínimos, nunca datos sensibles
 */
const STORAGE_KEYS = {
  SESSION_TOKEN: 'auth_token_session',
  SESSION_DATA: 'session_data'
} as const;

/**
 * Datos mínimos a almacenar en sesión (no incluyen información sensible)
 */
interface MinimalSessionData {
  id: number;
  role: string;
  lastLogin: number;
}

/**
 * Contexto de autenticación
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Función auxiliar para limpiar el almacenamiento de sesión
 * SECURITY: Limpia todos los datos de sesión sensibles
 */
function clearSessionStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Limpiar todos los datos de sesión
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Limpiar cualquier残留 de datos de usuario
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('session');
  } catch (error) {
    console.error('Error al limpiar almacenamiento:', error);
  }
}

/**
 * Función auxiliar para obtener los datos mínimos de sesión
 * SECURITY: Solo recupera datos mínimos necesarios, los datos completos
 * se obtienen del servidor
 */
function getStoredSession(): MinimalSessionData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const localData = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    const storedData = localData || sessionData;
    
    if (storedData) {
      const parsedData = JSON.parse(storedData) as MinimalSessionData;
      // Verificar que los datos mínimos sean válidos
      if (parsedData && parsedData.id && parsedData.role) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error('Error al obtener sesión almacenada:', error);
    clearSessionStorage();
  }
  return null;
}

/**
 * Función para obtener el usuario desde el servidor
 * SECURITY: Los datos completos del usuario se obtienen del servidor, no del cliente
 */
async function fetchUserFromServer(): Promise<User | null> {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      credentials: 'include' // Incluir cookies para autenticación
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        return data.user as User;
      }
    }
  } catch (error) {
    console.error('Error al obtener usuario del servidor:', error);
  }
  return null;
}

/**
 * Proveedor de autenticación
 * Gestiona el estado de sesión, login, logout y limpieza de eventos
 * SECURITY: Implementa almacenamiento seguro de sesión con datos mínimos
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

  // Efecto para cargar usuario inicial desde sesión segura
  useEffect(() => {
    const loadUser = async () => {
      const storedSession = getStoredSession();
      
      if (storedSession) {
        // SECURITY: Obtener datos completos del usuario desde el servidor
        // para garantizar que los datos no han sido manipulados localmente
        const serverUser = await fetchUserFromServer();
        if (serverUser) {
          setUser(serverUser);
        } else {
          // Si no se puede obtener del servidor, la sesión es inválida
          clearSessionStorage();
        }
      }
      setLoading(false);
    };
    
    loadUser();
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
      
      // SECURITY: Almacenar solo datos mínimos de sesión, nunca datos sensibles completos
      const minimalSessionData: MinimalSessionData = {
        id: data.user.id,
        role: data.user.role,
        lastLogin: Date.now()
      };
      
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(minimalSessionData));
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(minimalSessionData));
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