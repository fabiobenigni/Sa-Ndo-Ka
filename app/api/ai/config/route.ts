import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const configSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  apiKey: z.string().optional(),
  enabled: z.boolean(),
});

// Funzione semplice per "cifrare" (in produzione usare una libreria seria)
function encrypt(text: string): string {
  // In produzione, usa una chiave da env e un algoritmo serio
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.NEXTAUTH_SECRET || 'default-key-32-chars-long!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.NEXTAUTH_SECRET || 'default-key-32-chars-long!!', 'utf8').slice(0, 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText; // Fallback se non cifrato
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const configs = await prisma.aIConfig.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching AI configs:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle configurazioni AI' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, enabled } = configSchema.parse(body);

    const encryptedKey = apiKey ? encrypt(apiKey) : null;

    const config = await prisma.aIConfig.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
      update: {
        apiKey: encryptedKey || undefined,
        enabled,
      },
      create: {
        userId: session.user.id,
        provider,
        apiKey: encryptedKey,
        enabled,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating AI config:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della configurazione AI' },
      { status: 500 }
    );
  }
}

