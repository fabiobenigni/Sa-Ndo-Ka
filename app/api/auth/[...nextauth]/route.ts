import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Funzione per ottenere l'URL base dalla richiesta
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    // Se host contiene una porta, usala, altrimenti aggiungi porta 80 per HTTP
    if (host.includes(':')) {
      return `${protocol}://${host}`;
    }
    // Per HTTP senza porta esplicita, non aggiungere porta (default 80)
    if (protocol === 'https') {
      return `${protocol}://${host}`;
    }
    return `${protocol}://${host}`;
  }
  
  // Fallback a NEXTAUTH_URL o localhost
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

const handler = async (req: NextRequest, context: any) => {
  // Se NEXTAUTH_URL non è impostato o è localhost, prova a usare l'URL dalla richiesta
  if (!process.env.NEXTAUTH_URL || 
      process.env.NEXTAUTH_URL === 'http://localhost' || 
      process.env.NEXTAUTH_URL === 'http://localhost:3000') {
    const baseUrl = getBaseUrl(req);
    // Imposta temporaneamente NEXTAUTH_URL per questa richiesta
    process.env.NEXTAUTH_URL = baseUrl;
  }
  
  return NextAuth(authOptions)(req, context);
};

export { handler as GET, handler as POST };

