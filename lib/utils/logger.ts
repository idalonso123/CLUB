/**
 * Sistema Centralizado de Logging para Club ViveVerde
 * 
 * Proporciona una capa unificada para el registro de eventos,
 * errores y métricas de la aplicación.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

import { ErrorCategory } from '@/hooks/useErrorHandler';

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

/**
 * Niveles de log disponibles
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Categorías de log para filtrado y análisis
 */
export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  FRONTEND = 'frontend',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SYSTEM = 'system',
}

/**
 * Interfaz de entrada de log
 */
export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  error?: Error;
}

/**
 * Configuración del logger
 */
export interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  minLevel: LogLevel;
  categories: LogCategory[];
  remoteEndpoint?: string;
  environment: 'development' | 'production' | 'test';
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

// Configuración por defecto
const defaultConfig: LoggerConfig = {
  enableConsole: process.env.NODE_ENV !== 'production',
  enableRemote: process.env.NODE_ENV === 'production',
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  categories: Object.values(LogCategory),
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
};

// Configuración activa (puede ser modificada)
let activeConfig: LoggerConfig = { ...defaultConfig };

/**
 * Actualiza la configuración del logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  activeConfig = { ...activeConfig, ...config };
}

/**
 * Obtiene la configuración actual del logger
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...activeConfig };
}

// ============================================================================
// UTILIDADES DE FORMATEO
// ============================================================================

/**
 * Obtiene el prefijo de color para el nivel de log
 */
function getLevelPrefix(level: LogLevel): string {
  const prefixes: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '🔵',
    [LogLevel.INFO]: 'ℹ️',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.ERROR]: '❌',
    [LogLevel.CRITICAL]: '💥',
  };
  return prefixes[level];
}

/**
 * Obtiene el color ANSI para el nivel de log (terminal)
 */
function getLevelColor(level: LogLevel): string {
  const colors: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m',    // Cyan
    [LogLevel.INFO]: '\x1b[34m',     // Blue
    [LogLevel.WARN]: '\x1b[33m',     // Yellow
    [LogLevel.ERROR]: '\x1b[31m',    // Red
    [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
  };
  return colors[level];
}

/**
 * Formatea un timestamp para logging
 */
function formatTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Formatea un objeto para string
 */
function formatObject(obj: unknown): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  if (obj instanceof Error) {
    return `${obj.message}\n${obj.stack || ''}`;
  }
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ============================================================================
// ALMACENAMIENTO DE LOGS (IN-MEMORY)
// ============================================================================

// Buffer de logs para rotación
const LOG_BUFFER: LogEntry[] = [];
const MAX_LOG_BUFFER_SIZE = 1000;

/**
 * Añade una entrada al buffer de logs
 */
function addToBuffer(entry: LogEntry): void {
  LOG_BUFFER.push(entry);
  // Rotación de logs cuando se excede el tamaño máximo
  if (LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }
}

/**
 * Obtiene los logs del buffer
 */
export function getLogBuffer(): LogEntry[] {
  return [...LOG_BUFFER];
}

/**
 * Limpia el buffer de logs
 */
export function clearLogBuffer(): void {
  LOG_BUFFER.length = 0;
}

/**
 * Filtra logs por categoría
 */
export function filterLogsByCategory(category: LogCategory): LogEntry[] {
  return LOG_BUFFER.filter(entry => entry.category === category);
}

/**
 * Filtra logs por nivel
 */
export function filterLogsByLevel(level: LogLevel): LogEntry[] {
  return LOG_BUFFER.filter(entry => {
    const levels = Object.values(LogLevel);
    return levels.indexOf(entry.level) >= levels.indexOf(level);
  });
}

// ============================================================================
// LOGGER CORE
// ============================================================================

/**
 * Logger principal de la aplicación
 */
export class AppLogger {
  private category: LogCategory;
  private requestId?: string;
  private userId?: string;

  constructor(category: LogCategory) {
    this.category = category;
  }

  /**
   * Añade contexto de request al logger
   */
  setRequestContext(requestId: string, userId?: string): this {
    this.requestId = requestId;
    this.userId = userId;
    return this;
  }

  /**
   * Añade contexto de usuario al logger
   */
  setUserContext(userId: string): this {
    this.userId = userId;
    return this;
  }

  /**
   * Crea una entrada de log y la procesa
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Filtrar por nivel mínimo
    const levels = Object.values(LogLevel);
    if (levels.indexOf(level) < levels.indexOf(activeConfig.minLevel)) {
      return;
    }

    // Filtrar por categoría si está configurado
    if (activeConfig.categories.length > 0 && !activeConfig.categories.includes(this.category)) {
      return;
    }

    const entry: LogEntry = {
      level,
      category: this.category,
      message,
      timestamp: new Date(),
      context,
      requestId: this.requestId,
      userId: this.userId,
    };

    // Añadir al buffer
    addToBuffer(entry);

    // Log en consola si está habilitado
    if (activeConfig.enableConsole) {
      this.logToConsole(entry);
    }

    // Enviar a servicio remoto si está habilitado
    if (activeConfig.enableRemote && activeConfig.remoteEndpoint) {
      this.logToRemote(entry);
    }
  }

  /**
   * Log a consola con formato
   */
  private logToConsole(entry: LogEntry): void {
    const { level, category, message, timestamp, context, userId, requestId } = entry;
    
    const reset = '\x1b[0m';
    const color = getLevelColor(level);
    const prefix = getLevelPrefix(level);

    const parts: string[] = [];
    
    // Timestamp y nivel
    parts.push(`${color}[${formatTimestamp(timestamp)}] [${level.toUpperCase()}]${reset}`);
    
    // Categoría
    parts.push(`${color}[${category}]${reset}`);
    
    // Request ID si existe
    if (requestId) {
      parts.push(`${color}{req:${requestId.substring(0, 8)}}`);
    }
    
    // User ID si existe
    if (userId) {
      parts.push(`${color}[user:${userId}]`);
    }
    
    parts.push(`${color}${prefix} ${message}${reset}`);
    
    // Context adicional
    if (context && Object.keys(context).length > 0) {
      parts.push(`${color}\n  Context: ${formatObject(context)}${reset}`);
    }

    // Output según nivel
    const output = parts.join(' ');
    
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(output);
        break;
    }
  }

  /**
   * Envía log a servicio remoto (placeholder para futura implementación)
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    // Placeholder para integración con servicios como:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - CloudWatch
    // - Custom backend logging service
    
    try {
      if (activeConfig.remoteEndpoint) {
        // En producción, aquí se enviaría el log al endpoint remoto
        // fetch(activeConfig.remoteEndpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry),
        // });
        
        // Por ahora, solo log local
        if (process.env.NODE_ENV === 'development') {
          console.log('Remote log (placeholder):', entry);
        }
      }
    } catch (error) {
      console.error('Error al enviar log remoto:', error);
    }
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS DE LOG
  // ============================================================================

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message, stack: error?.stack });
  }

  critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, { ...context, error: error?.message, stack: error?.stack });
  }
}

// ============================================================================
// FACTORY DE LOGGERS
// ============================================================================

/**
 * Crea un logger para una categoría específica
 */
export function createLogger(category: LogCategory): AppLogger {
  return new AppLogger(category);
}

/**
 * Loggers pre-configurados para diferentes categorías
 */
export const loggers = {
  auth: createLogger(LogCategory.AUTH),
  api: createLogger(LogCategory.API),
  database: createLogger(LogCategory.DATABASE),
  frontend: createLogger(LogCategory.FRONTEND),
  business: createLogger(LogCategory.BUSINESS),
  performance: createLogger(LogCategory.PERFORMANCE),
  security: createLogger(LogCategory.SECURITY),
  system: createLogger(LogCategory.SYSTEM),
};

// ============================================================================
// HELPERS ESPECÍFICOS
// ============================================================================

/**
 * Logger específico para errores de API
 */
export function logApiError(
  endpoint: string,
  error: Error,
  statusCode?: number,
  context?: Record<string, unknown>
): void {
  loggers.api.error(`API Error in ${endpoint}`, error, {
    ...context,
    statusCode,
    endpoint,
  });
}

/**
 * Logger específico para errores de base de datos
 */
export function logDatabaseError(
  operation: string,
  error: Error,
  query?: string,
  context?: Record<string, unknown>
): void {
  loggers.database.error(`Database Error in ${operation}`, error, {
    ...context,
    operation,
    query: query?.substring(0, 100), // Limitar longitud de query en logs
  });
}

/**
 * Logger específico para eventos de autenticación
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
  userId: string,
  success: boolean,
  details?: Record<string, unknown>
): void {
  const message = `Auth ${event}: ${success ? 'Success' : 'Failed'}`;
  
  if (success) {
    loggers.auth.info(message, {
      ...details,
      userId,
      event,
      success,
    });
  } else {
    loggers.auth.warn(message, {
      ...details,
      userId,
      event,
      success,
    });
  }
}

/**
 * Logger específico para métricas de rendimiento
 */
export function logPerformanceMetric(
  operation: string,
  durationMs: number,
  context?: Record<string, unknown>
): void {
  const message = `Performance: ${operation} took ${durationMs}ms`;
  
  if (durationMs > 1000) {
    loggers.performance.warn(message, {
      ...context,
      operation,
      durationMs,
      durationS: (durationMs / 1000).toFixed(2),
    });
  } else {
    loggers.performance.debug(message, {
      ...context,
      operation,
      durationMs,
      durationS: (durationMs / 1000).toFixed(2),
    });
  }
}

/**
 * Logger específico para eventos de seguridad
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>
): void {
  const message = `Security: ${event}`;
  
  switch (severity) {
    case 'low':
      loggers.security.info(message, details);
      break;
    case 'medium':
      loggers.security.warn(message, details);
      break;
    case 'high':
      loggers.security.error(message, undefined, details);
      break;
    case 'critical':
      loggers.security.critical(message, undefined, details);
      break;
  }
}

// ============================================================================
// UTILIDADES DE REQUEST ID
// ============================================================================

/**
 * Genera un ID único para request
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createLogger,
  configureLogger,
  getLoggerConfig,
  getLogBuffer,
  clearLogBuffer,
  filterLogsByCategory,
  filterLogsByLevel,
  loggers,
  logApiError,
  logDatabaseError,
  logAuthEvent,
  logPerformanceMetric,
  logSecurityEvent,
  generateRequestId,
  LogLevel,
  LogCategory,
};