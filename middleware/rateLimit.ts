/**
 * Middleware de Rate Limiting para APIs
 * Protege contra ataques de fuerza bruta y sobrecarga
 * 
 * IMPORTANTE: Esta implementación es para desarrollo y producción con una sola instancia.
 * Para producción con múltiples instancias, usar Redis como store compartido:
 * 
 * @example
 * // Instalación de Redis:
 * npm install ioredis
 * 
 * // Configuración de producción:
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * // En rate limiting, reemplazar Map con:
 * // const RATE_LIMIT_KEY_PREFIX = 'rate_limit:';
 * // const redisStore = {
 * //   async get(key: string): Promise<RateLimitInfo | null> { ... },
 * //   async set(key: string, info: RateLimitInfo): Promise<void> { ... },
 * //   async delete(key: string): Promise<void> { ... }
 * // };
 */

import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Configuración de rate limiting por tipo de endpoint
 */
interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en milisegundos
  maxRequests: number;    // Máximo de solicitudes por ventana
}

/**
 * Configuraciones predefinidas
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Límite estricto para login (prevenir fuerza bruta)
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10            // 10 intentos por ventana
  },
  // Límite para registro
  register: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5            // 5 registros por hora
  },
  // Límite para APIs generales
  api: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 200           // 200 solicitudes por minuto
  },
  // Límite para envío de emails
  email: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10            // 10 emails por hora
  }
};

/**
 * Información de rate limit para un cliente
 */
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Almacenamiento en memoria para rate limits
 * 
 * ADVERTENCIA: Esta implementación tiene limitaciones en producción:
 * - No funciona con múltiples instancias del servidor
 * - Se reinicia con cada despliegue
 * - Puede haber memory leaks con muchas IPs diferentes
 * 
 * Para producción, usar Redis o similar.
 */
const rateLimitStore = new Map<string, RateLimitInfo>();

// Limpiar entradas antiguas del store periódicamente para prevenir memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const MAX_STORE_SIZE = 100000; // Máximo de entradas antes de forzar limpieza

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Inicializa el cleanup interval
 */
function initCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, info] of rateLimitStore.entries()) {
      if (info.resetTime < now) {
        rateLimitStore.delete(key);
        deletedCount++;
      }
    }
    
    // Si el store es muy grande, limpiar más agresivamente
    if (rateLimitStore.size > MAX_STORE_SIZE) {
      const entries = Array.from(rateLimitStore.entries());
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
      
      // Eliminar las entradas más antiguas hasta dejar el 50%
      const toDelete = entries.slice(0, Math.floor(entries.length * 0.5));
      for (const [key] of toDelete) {
        rateLimitStore.delete(key);
      }
      
      console.warn(`Rate limit store exceeded max size. Cleaned ${toDelete.length} old entries.`);
    }
    
    if (deletedCount > 0) {
      console.log(`Rate limit cleanup: removed ${deletedCount} expired entries`);
    }
  }, CLEANUP_INTERVAL_MS);
}

// Iniciar cleanup
initCleanup();

/**
 * Obtiene estadísticas del store (útil para debugging/monitoring)
 */
export function getRateLimitStoreStats(): { size: number; oldestEntry: number | null } {
  const now = Date.now();
  let oldestEntry: number | null = null;
  
  for (const info of rateLimitStore.values()) {
    if (!oldestEntry || info.resetTime < oldestEntry) {
      oldestEntry = info.resetTime;
    }
  }
  
  return {
    size: rateLimitStore.size,
    oldestEntry
  };
}

/**
 * Genera clave única para el cliente
 */
function getClientKey(req: NextApiRequest, type: string): string {
  // Usar IP del cliente o fingerprint como identificador
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.headers['x-real-ip']?.toString() || 
             req.socket.remoteAddress || 
             'unknown';
  return `${type}:${ip}`;
}

/**
 * Obtiene información de rate limit para un cliente
 */
function getRateLimitInfo(key: string): RateLimitInfo {
  const now = Date.now();
  const info = rateLimitStore.get(key);
  
  if (!info || info.resetTime < now) {
    return {
      count: 0,
      resetTime: now
    };
  }
  
  return info;
}

/**
 * Actualiza información de rate limit para un cliente
 */
function updateRateLimitInfo(key: string, windowMs: number): RateLimitInfo {
  const now = Date.now();
  const info = getRateLimitInfo(key);
  
  const newInfo: RateLimitInfo = {
    count: info.count + 1,
    resetTime: Math.max(info.resetTime, now) + windowMs
  };
  
  rateLimitStore.set(key, newInfo);
  return newInfo;
}

/**
 * Crea middleware de rate limiting
 * @param type - Tipo de endpoint para aplicar el límite
 * @returns Función middleware de Next.js
 */
export function rateLimit(type: string = 'api') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.api;
  
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    // Verificar si el rate limiting está deshabilitado via variable de entorno
    // IMPORTANTE: Solo usar en desarrollo o entornos controlados, NUNCA en producción
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }
    
    const key = getClientKey(req, type);
    const info = updateRateLimitInfo(key, config.windowMs);
    
    // Calcular tiempo restante hasta reset
    const resetTimeSeconds = Math.ceil((info.resetTime - Date.now()) / 1000);
    const remaining = Math.max(0, config.maxRequests - info.count);
    
    // Headers de rate limiting
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));
    res.setHeader('Retry-After', resetTimeSeconds > 0 ? resetTimeSeconds : 1);
    
    // Verificar si se excedió el límite
    if (info.count > config.maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
        error: 'rate_limit_exceeded',
        retryAfter: resetTimeSeconds
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware específico para login
 */
export const loginRateLimit = rateLimit('login');

/**
 * Middleware específico para registro
 */
export const registerRateLimit = rateLimit('register');

/**
 * Middleware genérico para APIs
 */
export const apiRateLimit = rateLimit('api');

/**
 * Middleware para envío de emails
 */
export const emailRateLimit = rateLimit('email');
