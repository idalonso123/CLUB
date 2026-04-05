/**
 * Constantes de Best Practices para Club ViveVerde
 * 
 * Este archivo centraliza las mejores prácticas y constantes
 * de configuración para la aplicación.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================================================

/**
 * Configuración general de la aplicación
 */
export const APP_CONFIG = {
  name: 'Club ViveVerde',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  defaultPageSize: 50,
  maxPageSize: 100,
} as const;

// ============================================================================
// LÍMITES Y THRESHOLDS
// ============================================================================

/**
 * Límites de la aplicación
 */
export const LIMITS = {
  // Paginación
  minPageSize: 10,
  maxPageSize: 100,
  defaultPageSize: 50,
  
  // Tiempo (en milisegundos)
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  tokenRefreshBuffer: 5 * 60 * 1000, // 5 minutos antes de expirar
  rateLimitWindow: 60 * 1000, // 1 minuto
  rateLimitMax: 100, // máximo requests por ventana
  
  // Caching
  cacheMaxSize: 100, // máximo de items en cache
  cacheTTL: 5 * 60 * 1000, // 5 minutos TTL
  
  // Archivos
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Puntos
  maxPointsAdjustment: 100000,
  minPointsAdjustment: -100000,
} as const;

// ============================================================================
// REGEX DE VALIDACIÓN
// ============================================================================

/**
 * Expresiones regulares para validación
 */
export const REGEX_PATTERNS = {
  // Email
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Teléfono (formato español)
  phone: /^(\+34)?[0-9]{9}$/,
  
  // CIF/NIF español
  cif: /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/i,
  nif: /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i,
  
  // Código postal español
  postalCode: /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/,
  
  // Contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
  password: /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Nombre (solo letras y espacios, acentos)
  name: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{2,50}$/,
  
  // URL
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// ============================================================================
// MENSAJES DE ERROR ESTÁNDAR
// ============================================================================

/**
 * Mensajes de error amigables
 */
export const ERROR_MESSAGES = {
  // Errores de red
  networkError: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
  timeoutError: 'La solicitud tardó demasiado. Intenta de nuevo.',
  
  // Errores de autenticación
  sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  unauthorized: 'No tienes permiso para realizar esta acción.',
  invalidCredentials: 'Credenciales inválidas. Verifica tu email y contraseña.',
  
  // Errores de validación
  requiredField: 'Este campo es obligatorio.',
  invalidEmail: 'Por favor, introduce un email válido.',
  invalidPhone: 'Por favor, introduce un número de teléfono válido.',
  invalidPostalCode: 'Por favor, introduce un código postal válido.',
  passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
  passwordNeedsUppercase: 'La contraseña debe contener al menos una mayúscula.',
  passwordNeedsNumber: 'La contraseña debe contener al menos un número.',
  
  // Errores de servidor
  serverError: 'Algo salió mal en el servidor. Intenta más tarde.',
  notFound: 'El recurso solicitado no fue encontrado.',
  
  // Errores genéricos
  unknownError: 'Ocurrió un error inesperado. Intenta de nuevo.',
  tryAgainLater: 'Por favor, intenta de nuevo más tarde.',
} as const;

// ============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

/**
 * Configuración de seguridad
 */
export const SECURITY_CONFIG = {
  // JWT
  jwtExpiration: '24h',
  jwtRefreshExpiration: '7d',
  
  // Rate limiting
  enableRateLimit: true,
  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,
  },
  
  // CORS
  corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Headers de seguridad
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 año
  enableCSP: true,
} as const;

// ============================================================================
// CONFIGURACIÓN DE CACHE
// ============================================================================

/**
 * Configuración de cache
 */
export const CACHE_CONFIG = {
  // Keys de cache
  keys: {
    users: 'cache:users',
    rewards: 'cache:rewards',
    stats: 'cache:stats',
    userProfile: 'cache:user:profile',
  },
  
  // TTL en segundos
  ttl: {
    short: 60, // 1 minuto
    medium: 300, // 5 minutos
    long: 3600, // 1 hora
    persistent: 86400, // 24 horas
  },
  
  // Configuración de stale-while-revalidate
  swr: {
    users: { ttl: 300, staleWhileRevalidate: 600 },
    rewards: { ttl: 600, staleWhileRevalidate: 1200 },
    stats: { ttl: 60, staleWhileRevalidate: 120 },
  },
} as const;

// ============================================================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================================================

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultPageSize: 50,
  maxPageSize: 100,
  pageSizeOptions: [10, 25, 50, 100],
} as const;

// ============================================================================
// CONFIGURACIÓN DE TOASTS
// ============================================================================

/**
 * Configuración de notificaciones toast
 */
export const TOAST_CONFIG = {
  duration: {
    short: 3000,
    medium: 5000,
    long: 8000,
    persistent: 0, // No se cierra automáticamente
  },
  position: {
    default: 'top-right',
    success: 'top-right',
    error: 'top-right',
    loading: 'top-center',
  },
} as const;

// ============================================================================
// REGEX DE VALIDACIÓN
// ============================================================================

/**
 * Validadores utility functions
 */
export const VALIDATORS = {
  /**
   * Valida un email
   */
  isValidEmail(email: string): boolean {
    return REGEX_PATTERNS.email.test(email);
  },
  
  /**
   * Valida un número de teléfono español
   */
  isValidPhone(phone: string): boolean {
    return REGEX_PATTERNS.phone.test(phone.replace(/\s/g, ''));
  },
  
  /**
   * Valida un código postal español
   */
  isValidPostalCode(postalCode: string): boolean {
    return REGEX_PATTERNS.postalCode.test(postalCode);
  },
  
  /**
   * Valida una contraseña según los requisitos
   */
  isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push(ERROR_MESSAGES.passwordTooShort);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(ERROR_MESSAGES.passwordNeedsUppercase);
    }
    if (!/\d/.test(password)) {
      errors.push(ERROR_MESSAGES.passwordNeedsNumber);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  /**
   * Valida que un campo no esté vacío
   */
  isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  },
  
  /**
   * Valida longitud de texto
   */
  isWithinLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  },
  
  /**
   * Valida que un valor sea numérico y esté dentro de un rango
   */
  isWithinRange(value: number, min: number, max: number): boolean {
    return !isNaN(value) && value >= min && value <= max;
  },
};

// ============================================================================
// CONSTANTES DE NEGOCIO
// ============================================================================

/**
 * Constantes específicas del negocio
 */
export const BUSINESS_CONFIG = {
  // Puntos
  points: {
    minPerTransaction: 0,
    maxPerTransaction: 10000,
    expirationDays: 365,
    decimalPlaces: 0,
  },
  
  // Recompensas
  rewards: {
    minStock: 0,
    maxStock: 99999,
    imageMaxSize: 2 * 1024 * 1024, // 2MB
  },
  
  // Carnets de mascotas
  petCards: {
    maxStamps: 10,
    expirationMonths: 12,
  },
  
  // Segmentos de email
  emailSegments: {
    maxPerUser: 100,
    maxFilters: 20,
  },
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene el mensaje de error para una categoría de error
 */
export function getErrorMessage(category: string): string {
  const messages: Record<string, string> = {
    network: ERROR_MESSAGES.networkError,
    authentication: ERROR_MESSAGES.sessionExpired,
    validation: ERROR_MESSAGES.requiredField,
    database: ERROR_MESSAGES.serverError,
    server: ERROR_MESSAGES.serverError,
    unknown: ERROR_MESSAGES.unknownError,
  };
  
  return messages[category] || ERROR_MESSAGES.unknownError;
}

/**
 * Formatea un valor para display (trunca si es muy largo)
 */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.substring(0, maxLength)}...`;
}

/**
 * Genera un slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}