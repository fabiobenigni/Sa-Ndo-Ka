import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Funzione per ottenere l'URL base dalla richiesta
function getBaseUrlFromRequest(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
  
  if (!host) {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  // Se host contiene una porta, usala, altrimenti aggiungi la porta di default
  const hasPort = host.includes(':');
  const port = hasPort ? '' : (protocol === 'https' ? ':443' : ':3000');
  
  return `${protocol}://${host}${port}`;
}

// Handler NextAuth con supporto per URL dinamici
const authHandler = NextAuth(authOptions);

async function handler(req: NextRequest, context: any) {
  // Rileva dinamicamente l'URL dalla richiesta
  const currentUrl = getBaseUrlFromRequest(req);
  const envUrl = process.env.NEXTAUTH_URL || '';
  // Se NEXTAUTH_URL è localhost o vuoto, usa l'URL dalla richiesta
  // Questo è necessario per supportare accesso tramite IP da mobile
  if (!envUrl || 
      envUrl.includes('localhost') || 
      envUrl.includes('127.0.0.1')) {
    // Modifica temporaneamente NEXTAUTH_URL per questa richiesta
    // Questo permette a NextAuth di generare i callback URL corretti
    const originalEnvUrl = process.env.NEXTAUTH_URL;
    try {
      process.env.NEXTAUTH_URL = currentUrl;
      return await authHandler(req, context);
    } catch (error) {
      console.error('[NextAuth] Error:', error);
      throw error;
    } finally {
      // Ripristina l'URL originale
      process.env.NEXTAUTH_URL = originalEnvUrl || '';
    }
  }
  
  // Altrimenti usa la configurazione normale
  return authHandler(req, context);
}

export { handler as GET, handler as POST };

