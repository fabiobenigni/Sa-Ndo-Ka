import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email richiesta' },
        { status: 400 }
      );
    }

    // Cerca l'utente
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Per sicurezza, non rivelare se l'email esiste o meno
    if (!user) {
      // Restituisci successo anche se l'utente non esiste (security best practice)
      return NextResponse.json({ success: true });
    }

    // Genera token di reset
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valido per 1 ora

    // Salva il token nel database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In produzione, qui invieresti una email con il link
    // Per ora, logghiamo il link (in produzione rimuovere questo)
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`;
    console.log(`Reset password link for ${email}: ${resetUrl}`);

    // TODO: Inviare email con il link di reset
    // await sendResetPasswordEmail(user.email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: 'Errore nella richiesta di reset password' },
      { status: 500 }
    );
  }
}

