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
      
      if (request.nextUrl.pathname.startsWith('/admin') && 
          payload.role !== 'administrador' && payload.role !== 'admin') {
        return NextResponse.redirect(dashboardUrl);
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
    '/login',
    '/register',
    '/forgot-password'
  ],
};