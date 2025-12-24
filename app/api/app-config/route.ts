import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBaseUrl, setBaseUrl } from '@/lib/app-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const baseUrl = await getBaseUrl();
    return NextResponse.json({ baseUrl });
  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero della configurazione' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { baseUrl } = body;

    if (!baseUrl || typeof baseUrl !== 'string') {
      return NextResponse.json(
        { error: 'Base URL non valida' },
        { status: 400 }
      );
    }

    // Valida formato URL
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json(
        { error: 'Formato URL non valido' },
        { status: 400 }
      );
    }

    await setBaseUrl(baseUrl, session.user.id);
    return NextResponse.json({ success: true, baseUrl });
  } catch (error) {
    console.error('Error updating app config:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della configurazione' },
      { status: 500 }
    );
  }
}

