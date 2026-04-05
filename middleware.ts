import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Headers de seguridad
 */
const securityHeaders = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Middleware principal de la aplicación
 * Maneja autenticación, autorización y headers de seguridad
 */
export async function middleware(request: NextRequest) {
  // Aplicar headers de seguridad a todas las respuestas
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rutas de autenticación
  const isAuthPage = 
    request.nextUrl.pathname === '/login' || 
    request.nextUrl.pathname === '/register' || 
    request.nextUrl.pathname === '/forgot-password';
  
  const token = request.cookies.get('auth_token')?.value;
  
  const loginUrl = new URL('/login', request.url);
  const dashboardUrl = new URL('/dashboard', request.url);
  
  if (!isAuthPage) {
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  }
  
  // Verificar JWT_SECRET
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.warn('JWT_SECRET no está configurado. Usando valor por defecto (NO RECOMENDADO para producción).');
  }
  
  const secretKey = new TextEncoder().encode(JWT_SECRET || 'club-viveverde-secret-key');
  
  if (token && isAuthPage) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.redirect(dashboardUrl);
    } catch (error) {
      // Token inválido - limpiar cookie y permitir acceso a login
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(loginUrl);
  }
  
  if (token && !isAuthPage) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      const userRole = payload.role as string;
      const isAdmin = userRole === 'administrador' || userRole === 'admin';
      const isCajero = userRole === 'cajero';
      const isMarketing = userRole === 'marketing';
      
      // Redirigir desde /admin si no es administrador ni marketing
      if (request.nextUrl.pathname.startsWith('/admin') && 
          !isAdmin && !isMarketing) {
        return NextResponse.redirect(dashboardUrl);
      }
      
      // Redirigir desde /teller si no es administrador ni cajero
      if (request.nextUrl.pathname.startsWith('/teller') && 
          !isAdmin && !isCajero) {
        return NextResponse.redirect(dashboardUrl);
      }
      
      // Si marketing intenta acceder a otras secciones del admin (no /marketing)
      if (isMarketing && 
          request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/marketing', request.url));
      }
      
      return response;
    } catch (error) {
      // Token inválido o expirado - limpiar y redirigir a login
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*', 
    '/admin',
    '/admin/:path*', 
    '/marketing',
    '/marketing/:path*',
    '/perfil',
    '/perfil/:path*',
    '/puntos-fidelidad',
    '/puntos-fidelidad/:path*',
    '/carnets-mascotas',
    '/carnets-mascotas/:path*',
    '/rewards',
    '/rewards/:path*',
    '/teller',
    '/teller/:path*',
    '/login',
    '/register',
    '/forgot-password'
  ],
};