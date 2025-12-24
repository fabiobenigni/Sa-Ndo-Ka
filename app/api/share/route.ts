import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAppConfig } from '@/lib/app-config';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';

const shareSchema = z.object({
  collectionId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  method: z.enum(['email', 'whatsapp']),
  permission: z.enum(['read', 'full']), // 'read' = Solo Lettura, 'full' = Accesso Completo
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json(
        { error: 'collectionId richiesto' },
        { status: 400 }
      );
    }

    const shares = await prisma.collectionShare.findMany({
      where: {
        collectionId,
        collection: {
          userId: session.user.id,
        },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle condivisioni' },
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
    console.log('[Share API] Request body:', JSON.stringify(body, null, 2));
    
    let parsedData;
    try {
      parsedData = shareSchema.parse(body);
    } catch (parseError: any) {
      console.error('[Share API] Validation error:', parseError);
      return NextResponse.json(
        { error: 'Dati non validi', details: parseError.errors },
        { status: 400 }
      );
    }
    
    const { collectionId, email, phone, method, permission } = parsedData;
    console.log('[Share API] Parsed data:', { collectionId, email, phone, method, permission });

    // Verifica che la collezione appartenga all'utente
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.user.id,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collezione non trovata' },
        { status: 404 }
      );
    }

    // Trova utente invitato
    let invitedUser = null;
    if (email) {
      invitedUser = await prisma.user.findUnique({
        where: { email },
      });
    }

    // Crea condivisione usando SQL raw per evitare problemi con relazioni opzionali
    // Prisma ha problemi quando userId è null e richiede comunque la relazione user
    const shareId = randomUUID();
    const userIdValue = invitedUser?.id || null;
    const invitedByValue = email || phone || '';
    const acceptedValue = !!invitedUser ? 1 : 0;
    
    console.log('[Share API] Creating share with SQL:', {
      shareId,
      collectionId,
      userId: userIdValue,
      permission,
      invitedBy: invitedByValue,
      inviteMethod: method,
      accepted: acceptedValue,
    });
    
    let share;
    try {
      // Usa SQL raw per inserire direttamente, evitando i problemi di Prisma con relazioni opzionali
      await prisma.$executeRaw`
        INSERT INTO CollectionShare (id, "collectionId", "userId", permission, "invitedBy", "inviteMethod", accepted, "createdAt", "updatedAt")
        VALUES (${shareId}, ${collectionId}, ${userIdValue}, ${permission}, ${invitedByValue}, ${method}, ${acceptedValue}, datetime('now'), datetime('now'))
      `;
      
      // Recupera la condivisione appena creata usando findFirst per evitare problemi con userId null
      // Non includiamo user se userId è null per evitare errori di Prisma
      const includeOptions: any = {
        collection: true,
      };
      
      if (userIdValue) {
        includeOptions.user = true;
      }
      
      share = await prisma.collectionShare.findFirst({
        where: { id: shareId },
        include: includeOptions,
      });
      
      if (!share) {
        throw new Error('Failed to retrieve created share');
      }
      
      console.log('[Share API] Share created successfully:', share.id);
    } catch (createError: any) {
      console.error('[Share API] Error creating share:', createError);
      console.error('[Share API] Error details:', JSON.stringify(createError, null, 2));
      throw createError;
    }

    // Invia invito
    const appConfig = await getAppConfig();
    const origin = request.headers.get('origin') || appConfig?.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${origin}/dashboard/collections/${collectionId}?share=${share.id}`;

    let sendError: string | null = null;

    if (method === 'email' && email) {
      // Usa configurazione dal database o dalle variabili d'ambiente
      const smtpHost = appConfig?.smtpHost || process.env.SMTP_HOST;
      const smtpPort = appConfig?.smtpPort || process.env.SMTP_PORT || '587';
      const smtpUser = appConfig?.smtpUser || process.env.SMTP_USER;
      const smtpPass = appConfig?.smtpPass || process.env.SMTP_PASS;

      if (!smtpHost || !smtpUser || !smtpPass) {
        sendError = 'Configurazione SMTP non trovata. Configura SMTP Host, User e Password nella sezione Configurazione App.';
        console.error('[Share API] SMTP configuration missing');
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpPort === '465',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: smtpUser,
            to: email,
            subject: `Invito a Sa-Ndo-Ka: ${collection.name}`,
            html: `
              <h2>Sei stato invitato a visualizzare la collezione "${collection.name}"</h2>
              <p>Clicca sul link seguente per accedere:</p>
              <a href="${inviteUrl}">${inviteUrl}</a>
              <p>Permessi: ${permission === 'read' ? 'Solo lettura' : 'Accesso completo'}</p>
            `,
          });
          console.log(`[Share API] Email sent successfully to ${email}`);
        } catch (emailError: any) {
          sendError = `Errore nell'invio dell'email: ${emailError.message}`;
          console.error('[Share API] Email send error:', emailError);
        }
      }
    } else if (method === 'whatsapp' && phone) {
      // Genera link WhatsApp invece di inviare automaticamente
      // Formato: https://wa.me/[numero]?text=[messaggio]
      const cleanPhone = phone.replace(/[^0-9]/g, ''); // Rimuovi caratteri non numerici
      
      // Formatta il messaggio con l'URL su una riga separata con spazi per renderlo cliccabile
      // WhatsApp riconosce automaticamente gli URL se sono ben formattati e su righe separate
      // Assicuriamoci che l'URL sia completo e ben formato
      const formattedUrl = inviteUrl.startsWith('http') ? inviteUrl : `https://${inviteUrl}`;
      const message = encodeURIComponent(
        `Sei stato invitato a visualizzare la collezione "${collection.name}" su Sa-Ndo-Ka.\n\n🔗 Accedi qui:\n\n${formattedUrl}\n\nPermessi: ${permission === 'read' ? 'Solo Lettura' : 'Accesso Completo'}`
      );
      const whatsappLink = `https://wa.me/${cleanPhone}?text=${message}`;
      
      // Restituisci il link invece di inviare
      return NextResponse.json({
        ...share,
        whatsappLink: whatsappLink,
        info: 'Link WhatsApp generato. Condividilo manualmente o apri il link per inviare il messaggio.',
      }, { status: 201 });
    }

    // Se c'è un errore nell'invio, restituisci comunque la condivisione ma con un warning
    if (sendError) {
      return NextResponse.json(
        { 
          ...share, 
          warning: sendError,
          inviteUrl: inviteUrl, // Fornisci comunque l'URL per invio manuale
        },
        { status: 201 }
      );
    }

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Share API] Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Share API] Error sharing collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('[Share API] Error details:', errorMessage);
    return NextResponse.json(
      { error: `Errore nella condivisione: ${errorMessage}` },
      { status: 500 }
    );
  }
}

