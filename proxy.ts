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
 * Middleware principal de la aplicacion
 * Maneja autenticacion, autorizacion y headers de seguridad
 */
export async function middleware(request: NextRequest) {
  // Aplicar headers de seguridad a todas las respuestas
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rutas de autenticacion
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
  
  // Verificar JWT_SECRET - CRITICO PARA PRODUCCION
  const JWT_SECRET = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // En produccion, JWT_SECRET es absolutamente requerido
  if (!JWT_SECRET) {
    if (isProduction) {
      console.error('ERROR CRITICO: JWT_SECRET no esta configurado. La aplicacion no puede funcionar en produccion sin esta variable.');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Error de configuracion del servidor',
          message: 'El servidor no esta configurado correctamente. Contacta con el administrador.'
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.warn('ADVERTENCIA: JWT_SECRET no esta configurado en desarrollo. Usando valor de fallback (NO SEGURO PARA PRODUCCION).');
    }
  }
  
  // Usar un valor de fallback solo en desarrollo, nunca en produccion
  const secretKey = new TextEncoder().encode(JWT_SECRET || 'DEVELOPMENT_ONLY_KEY_DO_NOT_USE_IN_PROD_' + Date.now());
  
  if (token && isAuthPage) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.redirect(dashboardUrl);
    } catch (error) {
      // Token invalido - limpiar cookie y permitir acceso a login
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
      // Token invalido o expirado - limpiar y redirigir a login
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }
  
  return response;
}

export default middleware;

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
