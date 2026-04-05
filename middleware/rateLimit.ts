/**
 * Middleware de Rate Limiting para APIs
 * Protege contra ataques de fuerza bruta y sobrecarga
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
    maxRequests: 5            // 5 intentos por ventana
  },
  // Límite para registro
  register: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3            // 3 registros por hora
  },
  // Límite para APIs generales
  api: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 100           // 100 solicitudes por minuto
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
 * En producción, usar Redis o similar
 */
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Limpia entradas antiguas del store cada 5 minutos
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (info.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
