import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Funzione per ottenere l'URL base dalla richiesta
function getBaseUrlFromRequest(request: NextRequest): string {
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Fallback
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

// Crea un handler che configura dinamicamente NEXTAUTH_URL
export async function GET(request: NextRequest, context: any) {
  // Se NEXTAUTH_URL è localhost ma la richiesta viene da un IP, usa l'IP
  const requestUrl = getBaseUrlFromRequest(request);
  const currentNextAuthUrl = process.env.NEXTAUTH_URL || '';
  
  // Se la richiesta viene da un IP diverso da localhost, usa l'URL della richiesta
  if (requestUrl.includes('192.168.') || requestUrl.includes('10.') || 
      requestUrl.includes('172.') || (!requestUrl.includes('localhost') && requestUrl !== currentNextAuthUrl)) {
    // Imposta temporaneamente NEXTAUTH_URL per questa richiesta
    const originalUrl = process.env.NEXTAUTH_URL;
    process.env.NEXTAUTH_URL = requestUrl;
    
    try {
      return NextAuth(authOptions)(request, context);
    } finally {
      // Ripristina l'URL originale
      if (originalUrl) {
        process.env.NEXTAUTH_URL = originalUrl;
      }
    }
  }
  
  return NextAuth(authOptions)(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return GET(request, context);
}

