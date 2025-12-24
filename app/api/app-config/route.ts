import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBaseUrl, setBaseUrl, getAppConfig, setAppConfig } from '@/lib/app-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const config = await getAppConfig();
    return NextResponse.json({
      baseUrl: config?.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000',
      smtpHost: config?.smtpHost || process.env.SMTP_HOST || '',
      smtpPort: config?.smtpPort || process.env.SMTP_PORT || '',
      smtpUser: config?.smtpUser || process.env.SMTP_USER || '',
      smtpPass: config?.smtpPass || process.env.SMTP_PASS || '',
    });
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
    const {
      baseUrl,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
    } = body;

    // Valida baseUrl se fornita
    if (baseUrl) {
      if (typeof baseUrl !== 'string') {
        return NextResponse.json(
          { error: 'Base URL non valida' },
          { status: 400 }
        );
      }
      try {
        new URL(baseUrl);
      } catch {
        return NextResponse.json(
          { error: 'Formato URL non valido' },
          { status: 400 }
        );
      }
    }

    await setAppConfig({
      baseUrl,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
    }, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating app config:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della configurazione' },
      { status: 500 }
    );
  }
}

