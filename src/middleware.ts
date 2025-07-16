// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Se verifica la cookie del usuario en lugar del token.
    const userCookie = request.cookies.get('user');
    const { pathname } = request.nextUrl;

    // Rutas que requieren que el usuario esté autenticado.
    const protectedRoutes = ['/admin', '/panel', '/'];
    const isProtectedRoute = protectedRoutes.some(prefix => pathname.startsWith(prefix));

    // Si intenta acceder a una ruta protegida y no tiene la cookie de usuario, se le redirige al login.
    if (isProtectedRoute && !userCookie && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Si el usuario está logueado (tiene cookie) e intenta ir a /login,
    // se le redirige a la página principal para que el enrutador de allí decida a dónde enviarlo.
    if (userCookie && pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// El matcher ahora incluye la ruta raíz para protegerla también.
export const config = {
    matcher: ['/admin/:path*', '/panel/:path*', '/login', '/'],
};
