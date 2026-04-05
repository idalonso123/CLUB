/**
 * Security Headers Middleware
 * Añade headers de seguridad a todas las respuestas
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Headers de seguridad a aplicar
 */
const securityHeaders = {
  // Previene que el sitio se muestre en iframes (previene clickjacking)
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Previene MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control de referencias
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permisos del navegador
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // XSS Protection (para navegadores antiguos)
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self'",
    "connect-src 'self' https://www.google-analytics.com",
    "frame-src 'self'",
  ].join('; '),
};

/**
 * Headers de caché para assets estáticos
 */
const cacheHeaders = {
  // Assets estáticos con caché largo
  '/_next/static/': 'public, max-age=31536000, immutable',
  '/fonts/': 'public, max-age=31536000, immutable',
  
  // Imágenes con caché moderado
  '/images/': 'public, max-age=86400, stale-while-revalidate=604800',
  
  // Páginas HTML sin caché
  '/_next/data/': 'no-cache',
  
  // API sin caché por defecto
  '/api/': 'no-store, must-revalidate',
};

/**
 * Determina los headers de caché basados en la ruta
 */
function getCacheHeaders(pathname: string): Record<string, string> | null {
  for (const [prefix, value] of Object.entries(cacheHeaders)) {
    if (pathname.startsWith(prefix)) {
      return {
        'Cache-Control': value,
      };
    }
  }
  return null;
}

/**
 * Aplica headers de seguridad y caché a la respuesta
 */
export function applySecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  // Headers de seguridad a todas las respuestas
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Headers de caché basados en la ruta
  const cacheHeaders = getCacheHeaders(request.nextUrl.pathname);
  if (cacheHeaders) {
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Deshabilitar caching de headers en desarrollo
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

/**
 * Headers específicos para API
 */
export function applyAPIHeaders(response: NextResponse): NextResponse {
  // Headers de seguridad para APIs
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  
  // Headers de CORS para APIs públicas (si las hay)
  // Descomentar si tienes APIs públicas:
  // response.headers.set('Access-Control-Allow-Origin', 'https://tu-dominio.com');
  // response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Prevenir caching de respuestas API
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  
  return response;
}

/**
 * Headers específicos para errores
 */
export function applyErrorHeaders(response: NextResponse, statusCode: number): NextResponse {
  applySecurityHeaders({ nextUrl: { pathname: '' } } as NextRequest, response);
  
  // Personalizar según el código de error
  if (statusCode === 404) {
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
  } else if (statusCode >= 500) {
    // No cachear errores del servidor
    response.headers.set('Cache-Control', 'no-store');
  }
  
  return response;
}

/**
 * Verifica si la solicitud es de un bot o crawler
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawl/i,
    /slurp/i,
    /search/i,
    /fetch/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Obtiene información del cliente para logging
 */
export function getClientInfo(request: NextRequest): {
  ip: string;
  userAgent: string | null;
  isBot: boolean;
  country?: string;
} {
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';
    
  const userAgent = request.headers.get('user-agent');
  const country = request.geo?.country;
  
  return {
    ip: ip.trim(),
    userAgent,
    isBot: isBot(userAgent),
    country,
  };
}

export default {
  applySecurityHeaders,
  applyAPIHeaders,
  applyErrorHeaders,
  isBot,
  getClientInfo,
};
