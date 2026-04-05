/**
 * Sistema Unificado de Manejo de Errores
 * 
 * Proporciona utilidades centralizadas para el manejo de errores
 * en toda la aplicación, asegurando consistencia en la UX.
 */

import toast from 'react-hot-toast';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Categorías de errores para categorización y logging
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  DATABASE = 'database',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Interfaz estándar de error de la aplicación
 */
export interface AppError {
  message: string;
  category: ErrorCategory;
  originalError?: Error;
  context?: string;
  timestamp?: Date;
}

/**
 * Resultado de una operación con manejo de errores
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// ============================================================================
// CATEGORIZACIÓN DE ERRORES
// ============================================================================

/**
 * Determina la categoría de un error basado en su naturaleza
 */
export function categorizeError(error: unknown, context?: string): ErrorCategory {
  if (error instanceof Error) {
    // Errores de red
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')) {
      return ErrorCategory.NETWORK;
    }
    
    // Errores de autenticación
    if (error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('unauthorized') ||
        error.message.includes('token') ||
        error.message.includes('jwt')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    // Errores de validación
    if (error.message.includes('validation') ||
        error.message.includes('invalid') ||
        error.message.includes('required') ||
        error.message.includes('formato')) {
      return ErrorCategory.VALIDATION;
    }
    
    // Errores de base de datos
    if (error.message.includes('database') ||
        error.message.includes('mysql') ||
        error.message.includes('sql') ||
        error.message.includes('duplicate') ||
        error.message.includes('unique')) {
      return ErrorCategory.DATABASE;
    }
    
    // Errores de servidor
    if (error.message.includes('500') || 
        error.message.includes('server') ||
        error.message.includes('internal')) {
      return ErrorCategory.SERVER;
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Mensajes de error amigables por categoría
 */
const ERROR_MESSAGES: Record<ErrorCategory, Record<'title' | 'default', string>> = {
  [ErrorCategory.NETWORK]: {
    title: 'Error de Conexión',
    default: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
  },
  [ErrorCategory.AUTHENTICATION]: {
    title: 'Error de Autenticación',
    default: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  },
  [ErrorCategory.VALIDATION]: {
    title: 'Error de Validación',
    default: 'Por favor, verifica los datos ingresados e intenta nuevamente.',
  },
  [ErrorCategory.DATABASE]: {
    title: 'Error de Base de Datos',
    default: 'Ocurrió un error al procesar tu solicitud. Intenta más tarde.',
  },
  [ErrorCategory.SERVER]: {
    title: 'Error del Servidor',
    default: 'Algo salió mal en el servidor. Intenta más tarde.',
  },
  [ErrorCategory.UNKNOWN]: {
    title: 'Error Inesperado',
    default: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
  },
};

// ============================================================================
// CREACIÓN DE ERRORES
// ============================================================================

/**
 * Crea un error de aplicación estructurado
 */
export function createAppError(
  error: unknown,
  context?: string,
  customMessage?: string
): AppError {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const category = categorizeError(error, context);
  
  return {
    message: customMessage || ERROR_MESSAGES[category].default,
    category,
    originalError,
    context,
    timestamp: new Date(),
  };
}

// ============================================================================
// PRESENTACIÓN DE ERRORES (TOASTS)
// ============================================================================

/**
 * Muestra un toast de error con el formato estándar
 */
export function showErrorToast(appError: AppError): void {
  const config = ERROR_MESSAGES[appError.category];
  
  toast.error(
    `${config.title}: ${appError.message}`,
    {
      duration: 5000,
      icon: getErrorIcon(appError.category),
    }
  );
  
  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${appError.category.toUpperCase()}]${appError.context ? ` [${appError.context}]` : ''}:`, appError.originalError);
  }
}

/**
 * Muestra un toast de éxito
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 4000,
  });
}

/**
 * Muestra un toast de carga
 */
export function showLoadingToast(message: string): string {
  return toast.loading(message, {
    duration: Infinity, // Se cierra manualmente
  });
}

/**
 * Muestra un toast de información
 */
export function showInfoToast(message: string): void {
  toast(message, {
    duration: 4000,
  });
}

/**
 * Obtiene el icono SVG para cada categoría de error
 */
function getErrorIcon(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return '📡';
    case ErrorCategory.AUTHENTICATION:
      return '🔐';
    case ErrorCategory.VALIDATION:
      return '⚠️';
    case ErrorCategory.DATABASE:
      return '🗄️';
    case ErrorCategory.SERVER:
      return '🔧';
    default:
      return '❌';
  }
}

// ============================================================================
// UTILIDADES DE TRY/CATCH
// ============================================================================

/**
 * Wrapper para funciones asíncronas con manejo de errores
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string,
  onError?: (error: AppError) => void
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const appError = createAppError(error, context);
    
    if (onError) {
      onError(appError);
    } else {
      showErrorToast(appError);
    }
    
    return { success: false, error: appError };
  }
}

/**
 * Wrapper para funciones síncronas con manejo de errores
 */
export function withSyncErrorHandling<T>(
  fn: () => T,
  context?: string,
  onError?: (error: AppError) => void
): Result<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const appError = createAppError(error, context);
    
    if (onError) {
      onError(appError);
    } else {
      showErrorToast(appError);
    }
    
    return { success: false, error: appError };
  }
}

// ============================================================================
// HANDLERS DE ERRORES COMUNES
// ============================================================================

/**
 * Maneja errores de fetch de forma estándar
 */
export async function handleFetchError(
  response: Response,
  context?: string
): Promise<void> {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignorar errores al parsear respuesta
    }
    
    const appError = createAppError(
      new Error(errorMessage),
      context
    );
    
    showErrorToast(appError);
    throw appError;
  }
}

/**
 * Valida que una respuesta tenga el formato esperado
 */
export function validateResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  context?: string
): T {
  if (!validator(data)) {
    const appError = createAppError(
      new Error('Formato de respuesta inválido'),
      context
    );
    showErrorToast(appError);
    throw appError;
  }
  
  return data;
}

// ============================================================================
// EXPORTACIÓN DEL HOOK DE ERROR
// ============================================================================

import { useState, useCallback } from 'react';

/**
 * Hook para manejo de errores en componentes
 */
export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);
  
  const handleError = useCallback((err: unknown, context?: string) => {
    const appError = createAppError(err, context);
    setError(appError);
    showErrorToast(appError);
    return appError;
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    handleError,
    clearError,
  };
}
