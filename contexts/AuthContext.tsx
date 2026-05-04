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
  cajero_version?: 'web' | 'tpv';
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
 * Función para intentar abrir la aplicación TPV via protocolo personalizado
 * clubviveverde://open/dashboard
 */
function tryOpenTPVApplication(): Promise<{success: boolean; installed: boolean}> {
  return new Promise((resolve) => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      resolve({ success: false, installed: false });
      return;
    }

    // Intentar crear un iframe temporal para detectar si el protocolo está registrado
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'clubviveverde://status';
    
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
    
    const handleResult = (installed: boolean) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      
      if (installed) {
        // Si el protocolo está registrado, abrir la aplicación
        window.location.href = 'clubviveverde://open/dashboard';
        resolve({ success: true, installed: true });
      } else {
        resolve({ success: false, installed: false });
      }
    };
    
    // Timeout de 2 segundos para detectar que el protocolo no está registrado
    timeoutId = setTimeout(() => {
      handleResult(false);
    }, 2000);
    
    // El iframe cargará exitosamente solo si el protocolo está registrado
    iframe.onload = () => {
      handleResult(true);
    };
    
    iframe.onerror = () => {
      handleResult(false);
    };
    
    document.body.appendChild(iframe);
  });
}

/**
 * Función para verificar si el protocolo clubviveverde:// está registrado en Windows
 */
function checkProtocolRegistered(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'clubviveverde://status';
    
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
    
    const handleResult = (registered: boolean) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(registered);
    };
    
    timeoutId = setTimeout(() => {
      handleResult(false);
    }, 2000);
    
    iframe.onload = () => {
      handleResult(true);
    };
    
    iframe.onerror = () => {
      handleResult(false);
    };
    
    document.body.appendChild(iframe);
  });
}

/**
 * Función para descargar y ejecutar el instalador de Windows automáticamente
 */
async function downloadAndRunInstaller(): Promise<boolean> {
  try {
    const response = await fetch('/api/tpv/install-script');
    if (!response.ok) {
      console.log('[Auth] No se pudo descargar el instalador');
      return false;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'install-tpv-windows.ps1';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[Auth] Instalador descargado. El usuario debe ejecutarlo como Administrador.');
    return true;
  } catch (error) {
    console.error('[Auth] Error al descargar el instalador:', error);
    return false;
  }
}

/**
 * Función para verificar si Electron TPV está instalado
 * Usa el endpoint /api/tpv/setup para verificar estado local
 */
async function checkTPVInstallation(): Promise<{electronInstalled: boolean; canRunElectron: boolean}> {
  try {
    const resp = await fetch('/api/tpv/setup?action=status');
    const data = await resp.json();
    return {
      electronInstalled: data.electronInstalled || false,
      canRunElectron: data.canRunElectron || false
    };
  } catch {
    return { electronInstalled: false, canRunElectron: false };
  }
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
  // OPTIMIZADO: La sesión ahora se mantiene cuando el usuario cambia de pestaña
  // Solo se cierra sesión cuando:
  // - El usuario cierra el navegador/pestaña completamente
  // - El token expira (después de 1 día)
  // - El usuario hace clic en "Cerrar sesión"
  useEffect(() => {
    // Manejador para beforeunload (cierre de pestaña/navegador)
    // Este evento solo se dispara cuando el usuario cierra completamente el navegador o la pestaña
    const handleBeforeUnload = () => {
      // Solo limpiar sessionStorage cuando se cierra completamente
      // NO usar sendBeacon aquí porque ya no queremos forzar logout en cambio de pestaña
      // El token en cookie se maneja por el servidor con expiración de 1 día
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      }
    };

    // Registrar eventos solo para cierre completo del navegador
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Función de limpieza del efecto
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
      
      // Redirigir según rol de usuario y versión TPV
      let redirectPath: string;
      
      if (data.user.role === 'cajero' && data.user.cajero_version === 'tpv') {
        // Cajero con versión TPV: verificar si Electron está instalado
        // y si el protocolo está registrado
        
        // Primero redirigir a /tpv que manejará la verificación e instalación
        redirectPath = '/tpv';
        
        // Intentar abrir la aplicación de escritorio en background
        // (esto no bloquea la redirección)
        setTimeout(async () => {
          try {
            // Verificar si el protocolo está registrado primero
            const protocolRegistered = await checkProtocolRegistered();
            
            if (protocolRegistered) {
              // Protocolo registrado, intentar abrir la aplicación
              const result = await tryOpenTPVApplication();
              if (!result.success) {
                console.log('[Auth] Protocolo registrado pero aplicación no respondió');
              }
            } else {
              // Protocolo no registrado - el componente TPVSetup mostrará
              // la opción de descargar e instalar automáticamente
              console.log('[Auth] Protocolo no registrado, TPVSetup mostrará opción de instalación');
              
              // Almacenar en sessionStorage para que TPVSetup sepa que debe ofrecer instalación
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('tpv_needs_install', 'true');
              }
            }
          } catch (error) {
            console.error('[Auth] Error al verificar TPV:', error);
          }
        }, 100);
      } else {
        // Redirección por rol normal
        const roleRedirects: Record<string, string> = {
          'administrador': '/admin/dashboard',
          'admin': '/admin/dashboard',
          'cajero': '/teller',
          'teller': '/teller',
          'marketing': '/marketing'
        };
        redirectPath = roleRedirects[data.user.role] || '/puntos-fidelidad';
      }
      
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