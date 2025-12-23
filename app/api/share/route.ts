import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

const shareSchema = z.object({
  collectionId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  method: z.enum(['email', 'whatsapp']),
  permission: z.enum(['read', 'write', 'delete']),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, email, phone, method, permission } = shareSchema.parse(body);

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

    // Trova o crea utente invitato
    let invitedUser = null;
    if (email) {
      invitedUser = await prisma.user.findUnique({
        where: { email },
      });
    }

    // Crea condivisione
    const share = await prisma.collectionShare.create({
      data: {
        collectionId,
        userId: invitedUser?.id || 'pending',
        permission,
        invitedBy: email || phone || '',
        inviteMethod: method,
        accepted: !!invitedUser,
      },
    });

    // Invia invito
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const inviteUrl = `${origin}/dashboard/collections/${collectionId}?share=${share.id}`;

    if (method === 'email' && email) {
      // Invia email
      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: `Invito a Sa-Ndo-Ka: ${collection.name}`,
          html: `
            <h2>Sei stato invitato a visualizzare la collezione "${collection.name}"</h2>
            <p>Clicca sul link seguente per accedere:</p>
            <a href="${inviteUrl}">${inviteUrl}</a>
            <p>Permessi: ${permission}</p>
          `,
        });
      }
    } else if (method === 'whatsapp' && phone && process.env.TWILIO_ACCOUNT_SID) {
      // Invia WhatsApp
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${phone}`,
        body: `Sei stato invitato a visualizzare la collezione "${collection.name}" su Sa-Ndo-Ka. Accedi qui: ${inviteUrl}`,
      });
    }

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sharing collection:', error);
    return NextResponse.json(
      { error: 'Errore nella condivisione' },
      { status: 500 }
    );
  }
}

