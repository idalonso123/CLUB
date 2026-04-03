import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
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
  
  if (token && isAuthPage) {
    try {
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'club-viveverde-secret-key'
      );
      
      const verifyResult = await jwtVerify(token, JWT_SECRET);
      
      return NextResponse.redirect(dashboardUrl);
    } catch (error) {
      // Token inválido - permitir acceso a la página de login
    }
  }
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(loginUrl);
  }
  
  if (token && !isAuthPage) {
    try {
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'club-viveverde-secret-key'
      );
      
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userRole = payload.role as string;
      const isAdmin = userRole === 'administrador' || userRole === 'admin';
      const isCajero = userRole === 'cajero';
      const isMarketing = userRole === 'marketing';
      const isClient = !isAdmin && !isCajero && !isMarketing;
      
      // Redirigir desde /admin si no es administrador ni marketing
      if (request.nextUrl.pathname.startsWith('/admin') && 
          userRole !== 'administrador' && userRole !== 'admin' && userRole !== 'marketing') {
        return NextResponse.redirect(dashboardUrl);
      }
      
      // Redirigir desde /teller si no es administrador ni cajero
      if (request.nextUrl.pathname.startsWith('/teller') && 
          userRole !== 'administrador' && userRole !== 'admin' && userRole !== 'cajero') {
        return NextResponse.redirect(dashboardUrl);
      }
      
      // Redirigir desde /dashboard, /puntos-fidelidad, /carnets-mascotas, /rewards si es admin, cajero o marketing
      if (!isClient && (
          request.nextUrl.pathname === '/dashboard' ||
          request.nextUrl.pathname.startsWith('/dashboard') ||
          request.nextUrl.pathname === '/puntos-fidelidad' ||
          request.nextUrl.pathname.startsWith('/puntos-fidelidad') ||
          request.nextUrl.pathname === '/carnets-mascotas' ||
          request.nextUrl.pathname.startsWith('/carnets-mascotas') ||
          request.nextUrl.pathname === '/rewards' ||
          request.nextUrl.pathname.startsWith('/rewards')
        )) {
        // Redirigir según el rol
        if (isAdmin) {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else if (isCajero) {
          return NextResponse.redirect(new URL('/teller', request.url));
        } else if (isMarketing) {
          return NextResponse.redirect(new URL('/marketing', request.url));
        }
      }
      
      // Si marketing intenta acceder a otras secciones del admin (no /marketing)
      if (isMarketing && 
          request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/marketing', request.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*', 
    '/admin',
    '/admin/:path*', 
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