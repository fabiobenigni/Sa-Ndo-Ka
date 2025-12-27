import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Proteggi la root e le route dashboard
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // Usa l'URL dalla richiesta per supportare qualsiasi host/IP
      secureCookie: request.nextUrl.protocol === 'https:',
    });

    if (!token) {
      // Usa l'host dalla richiesta per il redirect
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

